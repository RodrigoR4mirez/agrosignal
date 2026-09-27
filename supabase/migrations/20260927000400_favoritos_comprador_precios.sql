begin;

-- ============================================================
-- 1. Productores favoritos y alertas de precio
-- ============================================================
create table public.favoritos (
  comprador_id uuid not null references public.perfiles(id) on delete cascade,
  productor_id uuid not null references public.perfiles(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (comprador_id, productor_id),
  check (comprador_id <> productor_id)
);
create index favoritos_productor_idx on public.favoritos(productor_id);
alter table public.favoritos enable row level security;
revoke all on public.favoritos from public, anon, authenticated;
grant select on public.favoritos to authenticated;
grant all on public.favoritos to service_role;
create policy favoritos_propios on public.favoritos for select to authenticated
  using (comprador_id = (select auth.uid()));

-- Seguir o dejar de seguir: solo compradores activos, y solo a productores.
create function public.seguir_productor(p_productor_id uuid, p_seguir boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if private.rol_actual() is distinct from 'comprador' then
    raise exception 'Solo un comprador con cuenta activa puede seguir productores.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.perfiles where id = p_productor_id and rol = 'productor') then
    raise exception 'No encontramos a ese productor.' using errcode = '22023';
  end if;
  if p_seguir then
    insert into public.favoritos(comprador_id, productor_id) values ((select auth.uid()), p_productor_id) on conflict do nothing;
  else
    delete from public.favoritos where comprador_id = (select auth.uid()) and productor_id = p_productor_id;
  end if;
  return p_seguir;
end;
$$;

-- Alertas por cultivo, con precio máximo por kg opcional (hasta 10 por comprador).
create table public.alertas_precio (
  id uuid primary key default gen_random_uuid(),
  comprador_id uuid not null references public.perfiles(id) on delete cascade,
  cultivo text not null check (char_length(btrim(cultivo)) between 2 and 60),
  precio_maximo_kg numeric(14,2) check (precio_maximo_kg is null or (precio_maximo_kg > 0 and precio_maximo_kg <> 'NaN'::numeric)),
  creado_en timestamptz not null default now()
);
create unique index alertas_precio_unica on public.alertas_precio(comprador_id, lower(btrim(cultivo)));
alter table public.alertas_precio enable row level security;
revoke all on public.alertas_precio from public, anon, authenticated;
grant select, delete on public.alertas_precio to authenticated;
grant insert (comprador_id, cultivo, precio_maximo_kg) on public.alertas_precio to authenticated;
grant all on public.alertas_precio to service_role;
create policy alertas_lectura on public.alertas_precio for select to authenticated using (comprador_id = (select auth.uid()));
create policy alertas_borrado on public.alertas_precio for delete to authenticated using (comprador_id = (select auth.uid()));
create policy alertas_creacion on public.alertas_precio for insert to authenticated
  with check (comprador_id = (select auth.uid()) and private.rol_actual() = 'comprador');

create function private.limitar_alertas() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.alertas_precio where comprador_id = new.comprador_id) >= 10 then
    raise exception 'Puedes tener hasta 10 alertas. Borra una para crear otra.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger limitar_alertas before insert on public.alertas_precio for each row execute function private.limitar_alertas();

-- Nombre base de un cultivo para agrupar variedades: "Palta Hass" → "palta".
create function private.cultivo_base(cultivo text) returns text
language sql immutable set search_path = '' as $$
  select lower(translate(split_part(btrim(cultivo), ' ', 1), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
$$;
create function private.sin_tildes(texto text) returns text
language sql immutable set search_path = '' as $$
  select lower(translate(btrim(texto), 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun'))
$$;

-- Avisos cuando un lote se publica o baja de precio: a quienes siguen al productor y a
-- quienes tienen una alerta del cultivo (sin duplicar si ya lo siguen).
create function private.avisar_lote() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  nuevo boolean := tg_op = 'UPDATE' and old.borrador and not new.borrador;
  rebaja boolean := tg_op = 'UPDATE' and not new.borrador and not old.borrador and new.precio_unidad < old.precio_unidad;
  productor text;
  precio_kg numeric := case when new.unidad = 'ton' then new.precio_unidad / 1000 else new.precio_unidad end;
  texto_precio text := 'S/ ' || to_char(new.precio_unidad, 'FM999G999G990D00') || ' por ' || new.unidad::text;
begin
  if not (nuevo or rebaja) or not private.lote_publicable(new.id) then return new; end if;
  select nombre_completo into productor from public.perfiles where id = new.productor_id;
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  select f.comprador_id,
    case when nuevo then productor || ' publicó ' || new.cultivo || ' a ' || texto_precio || '.'
      else productor || ' bajó el precio de ' || new.cultivo || ' a ' || texto_precio || '.' end,
    'lote', new.id
  from public.favoritos f join public.perfiles c on c.id = f.comprador_id
  where f.productor_id = new.productor_id and not c.suspendido;
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  select distinct a.comprador_id,
    'Alerta de ' || a.cultivo || ': ' || new.cultivo || ' a ' || texto_precio || ' en ' || new.region || '.',
    'lote', new.id
  from public.alertas_precio a join public.perfiles c on c.id = a.comprador_id
  where not c.suspendido and a.comprador_id <> new.productor_id
    and private.sin_tildes(new.cultivo) like '%' || private.sin_tildes(a.cultivo) || '%'
    and (a.precio_maximo_kg is null or precio_kg <= a.precio_maximo_kg)
    and not exists (select 1 from public.favoritos f where f.comprador_id = a.comprador_id and f.productor_id = new.productor_id);
  return new;
end;
$$;
create trigger avisar_lote after update of borrador, precio_unidad on public.lotes
  for each row execute function private.avisar_lote();

-- Productores que sigue el comprador actual (los perfiles ajenos no son legibles por RLS).
create function public.mis_productores_seguidos() returns table(id uuid, nombre text, foto text, finca text,
  region text, cultivo_principal text, lotes_activos integer, seguido_en timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.nombre_completo, p.foto, p.finca, p.region, p.cultivo_principal,
    (select count(*)::integer from public.catalogo_lotes l where l.productor_id = p.id), f.creado_en
  from public.favoritos f join public.perfiles p on p.id = f.productor_id
  where f.comprador_id = (select auth.uid()) and not p.suspendido
  order by f.creado_en desc
$$;

-- ============================================================
-- 2. Perfil del comprador
-- ============================================================
alter table public.perfiles
  add column empresa text check (empresa is null or char_length(btrim(empresa)) between 2 and 120),
  add column rubro text check (rubro is null or char_length(btrim(rubro)) between 2 and 80),
  add column cultivos_interes text[] not null default '{}' check (cardinality(cultivos_interes) <= 12),
  add column volumen_mensual_kg numeric(14,2) check (volumen_mensual_kg is null or (volumen_mensual_kg > 0 and volumen_mensual_kg <> 'NaN'::numeric)),
  add column mercados_destino text[] not null default '{}' check (cardinality(mercados_destino) <= 10);
grant update (empresa, rubro, cultivos_interes, volumen_mensual_kg, mercados_destino) on public.perfiles to authenticated;

-- Lo ve el propio comprador, un admin o un productor que tiene (o tuvo) pedidos con él.
create function public.perfil_comprador(p_comprador_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare usuario uuid := auth.uid(); resultado jsonb;
begin
  if private.rol_actual() is null or not (usuario = p_comprador_id or private.es_admin()
    or exists (select 1 from public.pedidos pe where pe.comprador_id = p_comprador_id and pe.productor_id = usuario)) then
    raise exception 'Solo ven este perfil los productores con pedidos de este comprador.' using errcode = '42501';
  end if;
  select jsonb_build_object('id', p.id, 'nombre', p.nombre_completo, 'foto', p.foto, 'region', p.region,
    'tipo_comprador', p.tipo_comprador, 'destino_exportacion', p.destino_exportacion, 'creado_en', p.creado_en,
    'empresa', p.empresa, 'rubro', p.rubro, 'cultivos_interes', p.cultivos_interes, 'volumen_mensual_kg', p.volumen_mensual_kg,
    'mercados_destino', p.mercados_destino, 'sobre_mi', p.sobre_mi,
    'pedidos_completados', (select count(*) from public.pedidos pe where pe.comprador_id = p.id and pe.estado in ('recibido', 'calificado')),
    'pedidos_totales', (select count(*) from public.pedidos pe where pe.comprador_id = p.id and pe.estado <> 'rechazado'),
    'productores_distintos', (select count(distinct pe.productor_id) from public.pedidos pe where pe.comprador_id = p.id and pe.estado in ('recibido', 'calificado')),
    'reputacion', private.resumen_reputacion(p.id),
    'resenas', coalesce((select jsonb_agg(r order by r->>'creado_en' desc) from (
      select jsonb_build_object('estrellas', c.estrellas, 'comentario', c.comentario, 'creado_en', c.creado_en,
        'autor', split_part(a.nombre_completo, ' ', 1) || ' ' || left(split_part(a.nombre_completo, ' ', 2), 1) || '.') r
      from public.calificaciones c join public.perfiles a on a.id = c.calificado_por
      where c.calificado_a = p.id and c.rol_calificador = 'productor' and private.calificacion_visible(c.visible, c.pedido_id)
      order by c.creado_en desc limit 10) x), '[]'::jsonb))
  into resultado from public.perfiles p where p.id = p_comprador_id and p.rol = 'comprador';
  return resultado;
end;
$$;

-- ============================================================
-- 3. Historial de precios por cultivo
-- ============================================================
create type public.fuente_precio as enum ('publicacion', 'venta');
create table public.historial_precios (
  id bigint generated always as identity primary key,
  lote_id uuid references public.lotes(id) on delete cascade,
  cultivo text not null,
  cultivo_base text not null,
  region text not null,
  precio_kg numeric(14,4) not null check (precio_kg > 0),
  fuente public.fuente_precio not null,
  ejemplo boolean not null default false,
  registrado_en timestamptz not null default now()
);
create index historial_precios_cultivo_idx on public.historial_precios(cultivo_base, registrado_en);
alter table public.historial_precios enable row level security;
revoke all on public.historial_precios from public, anon, authenticated;
grant all on public.historial_precios to service_role;

-- Cada publicación o cambio de precio de un lote publicado queda registrado.
create function private.registrar_precio_lote() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.borrador then return new; end if;
  if tg_op = 'INSERT' or old.borrador or new.precio_unidad is distinct from old.precio_unidad or new.unidad is distinct from old.unidad then
    insert into public.historial_precios(lote_id, cultivo, cultivo_base, region, precio_kg, fuente, ejemplo)
    values (new.id, new.cultivo, private.cultivo_base(new.cultivo), new.region,
      case when new.unidad = 'ton' then new.precio_unidad / 1000 else new.precio_unidad end, 'publicacion',
      coalesce(new.descripcion like '[Ejemplo] %', false));
  end if;
  return new;
end;
$$;
create trigger registrar_precio_lote after insert or update of precio_unidad, unidad, borrador on public.lotes
  for each row execute function private.registrar_precio_lote();

-- Cada venta recibida registra el precio acordado.
create function private.registrar_precio_venta() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'recibido' and old.estado is distinct from 'recibido' then
    insert into public.historial_precios(lote_id, cultivo, cultivo_base, region, precio_kg, fuente, ejemplo, registrado_en)
    select new.lote_id, new.cultivo, private.cultivo_base(new.cultivo), l.region,
      case when new.unidad = 'ton' then new.precio_unidad / 1000 else new.precio_unidad end, 'venta',
      coalesce(l.descripcion like '[Ejemplo] %', false), coalesce(new.recibido_en, now())
    from public.lotes l where l.id = new.lote_id;
  end if;
  return new;
end;
$$;
create trigger registrar_precio_venta after update of estado on public.pedidos
  for each row execute function private.registrar_precio_venta();

-- Datos existentes: lotes publicados y ventas ya recibidas.
insert into public.historial_precios(lote_id, cultivo, cultivo_base, region, precio_kg, fuente, ejemplo, registrado_en)
select l.id, l.cultivo, private.cultivo_base(l.cultivo), l.region,
  case when l.unidad = 'ton' then l.precio_unidad / 1000 else l.precio_unidad end, 'publicacion',
  coalesce(l.descripcion like '[Ejemplo] %', false), l.creado_en
from public.lotes l where not l.borrador;
insert into public.historial_precios(lote_id, cultivo, cultivo_base, region, precio_kg, fuente, ejemplo, registrado_en)
select pe.lote_id, pe.cultivo, private.cultivo_base(pe.cultivo), l.region,
  case when pe.unidad = 'ton' then pe.precio_unidad / 1000 else pe.precio_unidad end, 'venta',
  coalesce(l.descripcion like '[Ejemplo] %', false), coalesce(pe.recibido_en, pe.creado_en)
from public.pedidos pe join public.lotes l on l.id = pe.lote_id where pe.estado in ('recibido', 'calificado');

-- Serie mensual (hora de Lima) de un cultivo: precio publicado y precio de venta por kg.
create function public.historial_precio_cultivo(p_cultivo text, p_meses integer default 12)
returns table(mes date, publicado numeric, vendido numeric, minimo numeric, maximo numeric, publicaciones integer, ventas integer, ejemplo boolean)
language sql stable security definer set search_path = '' as $$
  select date_trunc('month', h.registrado_en at time zone 'America/Lima')::date,
    round(avg(h.precio_kg) filter (where h.fuente = 'publicacion'), 2),
    round(avg(h.precio_kg) filter (where h.fuente = 'venta'), 2),
    round(min(h.precio_kg), 2), round(max(h.precio_kg), 2),
    (count(*) filter (where h.fuente = 'publicacion'))::integer, (count(*) filter (where h.fuente = 'venta'))::integer,
    bool_or(h.ejemplo)
  from public.historial_precios h
  where h.cultivo_base = private.cultivo_base(p_cultivo)
    and h.registrado_en >= date_trunc('month', now() at time zone 'America/Lima') - make_interval(months => least(greatest(p_meses, 1), 36) - 1)
  group by 1 order by 1
$$;

-- Cultivos con historial, del más registrado al menos.
create function public.cultivos_con_precios() returns table(cultivo_base text, nombre text, registros integer)
language sql stable security definer set search_path = '' as $$
  select h.cultivo_base, initcap(min(split_part(btrim(h.cultivo), ' ', 1))), count(*)::integer
  from public.historial_precios h group by h.cultivo_base order by count(*) desc, h.cultivo_base
$$;

-- Perfil del productor: ahora con su número de seguidores.
create or replace function public.perfil_productor(p_productor_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'nombre', p.nombre_completo, 'region', p.region,
    'cultivo_principal', p.cultivo_principal, 'creado_en', p.creado_en, 'foto', p.foto,
    'finca', p.finca, 'hectareas', p.hectareas, 'anios_experiencia', p.anios_experiencia,
    'altitud_msnm', p.altitud_msnm, 'latitud', p.latitud, 'longitud', p.longitud, 'sobre_mi', p.sobre_mi,
    'practicas', p.practicas, 'meses_cosecha', p.meses_cosecha, 'capacidad_mensual_kg', p.capacidad_mensual_kg,
    'entregas', p.entregas, 'asociacion', p.asociacion,
    'ventas_completadas', (select count(*) from public.pedidos pe where pe.productor_id = p.id
      and pe.estado in ('recibido', 'calificado')),
    'lotes_activos', (select count(*) from public.catalogo_lotes l where l.productor_id = p.id),
    'nivel_maximo', coalesce((select max(l.nivel_sello) from public.catalogo_lotes l where l.productor_id = p.id), 0),
    'seguidores', (select count(*) from public.favoritos f where f.productor_id = p.id),
    'reputacion', private.resumen_reputacion(p.id))
  from public.perfiles p join auth.users u on u.id = p.id
  where p.id = p_productor_id and p.rol = 'productor' and not p.suspendido and u.email_confirmed_at is not null
$$;

revoke all on function private.limitar_alertas(), private.avisar_lote(), private.registrar_precio_lote(),
  private.registrar_precio_venta() from public, anon, authenticated;
revoke all on function public.seguir_productor(uuid, boolean), public.mis_productores_seguidos(),
  public.perfil_comprador(uuid), public.historial_precio_cultivo(text, integer), public.cultivos_con_precios() from public, anon, authenticated;
grant execute on function public.seguir_productor(uuid, boolean), public.mis_productores_seguidos(), public.perfil_comprador(uuid) to authenticated;
grant execute on function public.historial_precio_cultivo(text, integer), public.cultivos_con_precios() to anon, authenticated;

commit;
