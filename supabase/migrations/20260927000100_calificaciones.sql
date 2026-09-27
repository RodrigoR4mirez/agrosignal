begin;

-- Calificaciones bidireccionales con "doble ciego". Reemplaza pedidos.calificacion
-- y pedidos.comentario. Ver docs/MODULOS/03-transacciones.md § Calificaciones.
create type public.rol_calificador as enum ('comprador', 'productor');

-- Fecha exacta de recepción: la ventana de 14 días se cuenta desde aquí.
-- Pedidos anteriores: mejor aproximación disponible (último cambio de estado).
alter table public.pedidos add column recibido_en timestamptz;
update public.pedidos set recibido_en = actualizado_en where estado in ('recibido', 'calificado');
alter table public.pedidos add constraint recibido_en_corresponde
  check (estado not in ('recibido', 'calificado') or recibido_en is not null);

-- Hitos de la plataforma. El lanzamiento de calificaciones es la excepción
-- puntual de la ventana: nadie la tiene abierta antes de esta fecha + 14 días.
create table private.hitos (clave text primary key, en timestamptz not null);
insert into private.hitos values ('lanzamiento_calificaciones', now());
revoke all on private.hitos from public, anon, authenticated;

create table public.calificaciones (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id),
  calificado_por uuid not null references public.perfiles(id),
  calificado_a uuid not null references public.perfiles(id),
  rol_calificador public.rol_calificador not null,
  estrellas integer not null check (estrellas between 1 and 5),
  comentario text check (char_length(comentario) between 1 and 1000),
  visible boolean not null default false,
  creado_en timestamptz not null default now(),
  constraint calificacion_partes_distintas check (calificado_por <> calificado_a),
  constraint calificacion_una_por_rol unique (pedido_id, rol_calificador),
  constraint calificacion_una_por_persona unique (pedido_id, calificado_por)
);
create index calificaciones_recibidas_idx on public.calificaciones(calificado_a, creado_en desc);
create index calificaciones_ocultas_idx on public.calificaciones(pedido_id) where not visible;

-- Los ratings del comprador ya eran públicos: se conservan visibles.
insert into public.calificaciones(pedido_id, calificado_por, calificado_a, rol_calificador, estrellas, comentario, visible, creado_en)
select id, comprador_id, productor_id, 'comprador', calificacion, comentario, true, actualizado_en
from public.pedidos where calificacion is not null;

alter table public.pedidos drop constraint calificacion_corresponde_estado,
  drop column calificacion, drop column comentario;

create function private.cierre_calificacion(p_recibido_en timestamptz) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select case when p_recibido_en is null then null else
    greatest(p_recibido_en, (select h.en from private.hitos h where h.clave = 'lanzamiento_calificaciones'))
    + interval '14 days' end
$$;

-- Visible si ambas partes calificaron (columna) o si la ventana ya cerró.
-- Esta es la regla autoritativa; la columna se sincroniza al cerrar la ventana.
create function private.calificacion_visible(p_visible boolean, p_pedido_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_visible or exists (select 1 from public.pedidos p
    where p.id = p_pedido_id and now() >= private.cierre_calificacion(p.recibido_en))
$$;

create function private.proteger_calificacion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.id, new.pedido_id, new.calificado_por, new.calificado_a, new.rol_calificador, new.estrellas, new.comentario, new.creado_en)
    is distinct from (old.id, old.pedido_id, old.calificado_por, old.calificado_a, old.rol_calificador, old.estrellas, old.comentario, old.creado_en)
    or (old.visible and not new.visible) then
    raise exception 'Una calificación enviada no se puede modificar.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger proteger_calificacion before update on public.calificaciones
  for each row execute function private.proteger_calificacion();

alter table public.calificaciones enable row level security;
revoke all on public.calificaciones from public, anon, authenticated;
grant select on public.calificaciones to authenticated;
grant all on public.calificaciones to service_role;
-- Quien califica ve la suya; quien la recibe solo cuando ya es visible.
create policy calificaciones_lectura on public.calificaciones for select to authenticated
  using ((private.rol_actual() is not null and (calificado_por = (select auth.uid())
      or (calificado_a = (select auth.uid()) and private.calificacion_visible(visible, pedido_id))))
    or private.es_admin());

-- Reseñas públicas de productores: solo visibles, sin pedido ni identidad completa.
create view public.resenas_productores with (security_barrier = true) as
select c.id, c.calificado_a as productor_id, c.estrellas, c.comentario, c.creado_en,
  btrim(split_part(btrim(autor.nombre_completo), ' ', 1) || ' ' ||
    coalesce(left(nullif(split_part(btrim(autor.nombre_completo), ' ', 2), ''), 1) || '.', '')) as autor
from public.calificaciones c
join public.perfiles autor on autor.id = c.calificado_por
join public.perfiles productor on productor.id = c.calificado_a
where c.rol_calificador = 'comprador' and productor.rol = 'productor' and not productor.suspendido
  and private.calificacion_visible(c.visible, c.pedido_id);
revoke all on public.resenas_productores from public, anon, authenticated;
grant select on public.resenas_productores to anon, authenticated;

create function private.resumen_reputacion(p_usuario uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'total', count(*), 'promedio', round(avg(c.estrellas), 1),
    'distribucion', jsonb_build_object(
      '5', count(*) filter (where c.estrellas = 5), '4', count(*) filter (where c.estrellas = 4),
      '3', count(*) filter (where c.estrellas = 3), '2', count(*) filter (where c.estrellas = 2),
      '1', count(*) filter (where c.estrellas = 1)))
  from public.calificaciones c
  where c.calificado_a = p_usuario and private.calificacion_visible(c.visible, c.pedido_id)
$$;

-- Perfil público mínimo de un productor activo con su reputación.
create function public.perfil_productor(p_productor_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'nombre', p.nombre_completo, 'region', p.region,
    'cultivo_principal', p.cultivo_principal, 'creado_en', p.creado_en,
    'reputacion', private.resumen_reputacion(p.id))
  from public.perfiles p join auth.users u on u.id = p.id
  where p.id = p_productor_id and p.rol = 'productor' and not p.suspendido and u.email_confirmed_at is not null
$$;

-- Estado de calificación de un pedido para una de sus partes (o admin).
create function public.estado_calificacion_pedido(p_pedido_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  usuario uuid := auth.uid();
  rol public.rol_usuario := private.rol_actual();
  pedido public.pedidos;
  mia public.calificaciones;
  otra public.calificaciones;
  cierre timestamptz;
  mi_rol public.rol_calificador;
begin
  select * into pedido from public.pedidos where id = p_pedido_id;
  if not found or rol is null then
    raise exception 'No se encontró el pedido o no tienes permiso para verlo.' using errcode = '42501';
  end if;
  mi_rol := case when rol = 'comprador' and pedido.comprador_id = usuario then 'comprador'
    when rol = 'productor' and pedido.productor_id = usuario then 'productor' end;
  if mi_rol is null and rol <> 'admin' then
    raise exception 'No se encontró el pedido o no tienes permiso para verlo.' using errcode = '42501';
  end if;
  cierre := private.cierre_calificacion(pedido.recibido_en);
  if mi_rol is null then
    return jsonb_build_object('rol', null, 'cierre', cierre, 'vencido', coalesce(now() >= cierre, false),
      'calificaciones', coalesce((select jsonb_agg(to_jsonb(c) order by c.creado_en) from public.calificaciones c where c.pedido_id = pedido.id), '[]'::jsonb));
  end if;
  select * into mia from public.calificaciones where pedido_id = pedido.id and rol_calificador = mi_rol;
  select * into otra from public.calificaciones where pedido_id = pedido.id and rol_calificador <> mi_rol;
  return jsonb_build_object(
    'rol', mi_rol, 'cierre', cierre,
    'habilitado', pedido.estado in ('recibido', 'calificado'),
    'vencido', coalesce(now() >= cierre, false),
    'mia', case when mia.id is null then null else jsonb_build_object('estrellas', mia.estrellas, 'comentario', mia.comentario, 'creado_en', mia.creado_en,
      'visible', private.calificacion_visible(mia.visible, pedido.id)) end,
    'otra_enviada', otra.id is not null,
    'otra', case when otra.id is not null and private.calificacion_visible(otra.visible, pedido.id)
      then jsonb_build_object('estrellas', otra.estrellas, 'comentario', otra.comentario, 'creado_en', otra.creado_en) end);
end;
$$;

create function public.calificar_pedido(p_pedido_id uuid, p_estrellas integer, p_comentario text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := auth.uid();
  rol public.rol_usuario := private.rol_actual();
  pedido public.pedidos;
  v_comentario text := nullif(btrim(p_comentario), '');
  mi_rol public.rol_calificador;
  destino uuid;
  existente public.calificaciones;
  nueva public.calificaciones;
  cierre timestamptz;
  aviso text;
begin
  if rol is null then
    raise exception 'Necesitas una cuenta activa con correo verificado.' using errcode = '42501';
  end if;
  select * into pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'No se encontró el pedido o no tienes permiso para verlo.' using errcode = '42501';
  end if;
  if rol = 'comprador' and pedido.comprador_id = usuario then mi_rol := 'comprador'; destino := pedido.productor_id;
  elsif rol = 'productor' and pedido.productor_id = usuario then mi_rol := 'productor'; destino := pedido.comprador_id;
  else raise exception 'No tienes permiso para calificar este pedido.' using errcode = '42501';
  end if;
  if pedido.estado not in ('recibido', 'calificado') then
    raise exception 'Podrás calificar cuando el comprador confirme que recibió el pedido.' using errcode = '22023';
  end if;
  if p_estrellas is null or p_estrellas not between 1 and 5 or char_length(v_comentario) > 1000 then
    raise exception 'Elige entre 1 y 5 estrellas y un comentario de hasta 1000 caracteres.' using errcode = '22023';
  end if;
  select * into existente from public.calificaciones where pedido_id = pedido.id and calificado_por = usuario;
  if found then
    -- Reintentar el mismo envío no duplica nada; cambiarlo no está permitido.
    if existente.estrellas = p_estrellas and existente.comentario is not distinct from v_comentario then
      return existente.id;
    end if;
    raise exception 'Ya calificaste este pedido. La calificación enviada no se puede cambiar.' using errcode = '22023';
  end if;
  cierre := private.cierre_calificacion(pedido.recibido_en);
  if now() >= cierre then
    raise exception 'El plazo para calificar este pedido ya venció.' using errcode = '22023';
  end if;
  insert into public.calificaciones(pedido_id, calificado_por, calificado_a, rol_calificador, estrellas, comentario)
  values (pedido.id, usuario, destino, mi_rol, p_estrellas, v_comentario) returning * into nueva;
  if exists (select 1 from public.calificaciones where pedido_id = pedido.id and id <> nueva.id) then
    update public.calificaciones set visible = true where pedido_id = pedido.id;
    aviso := 'Pedido ' || left(pedido.id::text, 8) || ' de ' || pedido.cultivo || ': ambas calificaciones ya son visibles.';
    insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
    values (pedido.comprador_id, aviso, 'pedido', pedido.id), (pedido.productor_id, aviso, 'pedido', pedido.id);
  else
    insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
    values (destino, 'Pedido ' || left(pedido.id::text, 8) || ' de ' || pedido.cultivo
      || ': la otra parte ya te calificó. Califica tú también antes del '
      || to_char(cierre at time zone 'America/Lima', 'DD/MM/YYYY') || ' para ver su opinión.', 'pedido', pedido.id);
  end if;
  return nueva.id;
end;
$$;

-- Sincroniza la columna al cerrar la ventana (la lectura ya lo considera visible).
create function public.publicar_calificaciones_vencidas() returns integer
language sql security definer set search_path = '' as $$
  with publicadas as (
    update public.calificaciones c set visible = true from public.pedidos p
    where p.id = c.pedido_id and not c.visible and now() >= private.cierre_calificacion(p.recibido_en)
    returning c.id)
  select count(*)::integer from publicadas
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('publicar-calificaciones-vencidas', '17 * * * *', 'select public.publicar_calificaciones_vencidas()');
  end if;
end;
$$;

-- Vendedores con promedio bajo 3 y al menos 5 calificaciones visibles.
create function public.vendedores_en_revision() returns table (
  productor_id uuid, nombre text, telefono text, region text, suspendido boolean,
  total integer, promedio numeric, ultima timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador activo puede consultar esta sección.' using errcode = '42501';
  end if;
  return query
  select p.id, p.nombre_completo, p.telefono, p.region, p.suspendido,
    count(*)::integer, round(avg(c.estrellas), 1), max(c.creado_en)
  from public.calificaciones c join public.perfiles p on p.id = c.calificado_a
  where c.rol_calificador = 'comprador' and p.rol = 'productor'
    and private.calificacion_visible(c.visible, c.pedido_id)
  group by p.id having count(*) >= 5 and avg(c.estrellas) < 3
  order by avg(c.estrellas), count(*) desc;
end;
$$;

-- "calificado" ya no es un paso: el pedido termina en "recibido" y las
-- calificaciones viven en su tabla. Los pedidos "calificado" antiguos se
-- tratan como recibidos.
drop function public.cambiar_estado_pedido(uuid, public.estado_pedido, text, integer, text);
create function public.cambiar_estado_pedido(
  p_pedido_id uuid, p_estado public.estado_pedido, p_motivo text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := auth.uid();
  rol public.rol_usuario := private.rol_actual();
  pedido public.pedidos;
  lote public.lotes;
  autorizado boolean := false;
  v_motivo text := nullif(btrim(p_motivo), '');
begin
  if rol is null then
    raise exception 'Necesitas una cuenta activa con correo verificado.' using errcode = '42501';
  end if;
  select * into pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'No se encontró el pedido o no tienes permiso para verlo.' using errcode = '42501';
  end if;
  autorizado := case
    when p_estado in ('confirmado', 'rechazado', 'enviado') then rol = 'productor' and pedido.productor_id = usuario
    when p_estado = 'recibido' then rol = 'comprador' and pedido.comprador_id = usuario
    when p_estado = 'cancelado' then rol = 'admin'
      or (rol = 'comprador' and pedido.comprador_id = usuario)
      or (rol = 'productor' and pedido.productor_id = usuario)
    else false end;
  if not coalesce(autorizado, false) then
    raise exception 'No tienes permiso para realizar este cambio.' using errcode = '42501';
  end if;
  if p_estado in ('rechazado', 'cancelado') and (coalesce(char_length(v_motivo), 0) not between 3 and 1000) then
    raise exception 'Indica un motivo de entre 3 y 1000 caracteres.' using errcode = '22023';
  end if;
  if p_estado not in ('rechazado', 'cancelado') and v_motivo is not null then
    raise exception 'Este cambio no necesita un motivo.' using errcode = '22023';
  end if;
  -- Retrying an already completed step is a no-op, including stock and notices.
  if pedido.estado = p_estado then
    return pedido.id;
  end if;
  if not ((pedido.estado = 'pendiente' and p_estado in ('confirmado', 'rechazado', 'cancelado'))
    or (pedido.estado = 'confirmado' and p_estado in ('enviado', 'cancelado'))
    or (pedido.estado = 'enviado' and p_estado = 'recibido')) then
    raise exception 'El pedido cambió de estado. Actualiza la página para continuar.' using errcode = '22023';
  end if;
  -- Serialize confirmations and returns for this lot, after locking the order.
  if p_estado = 'confirmado' or (p_estado = 'cancelado' and pedido.estado = 'confirmado') then
    select * into lote from public.lotes where id = pedido.lote_id for update;
    if p_estado = 'confirmado' then
      if not private.lote_publicable(lote.id) then
        raise exception 'Este lote ya no está disponible para confirmar pedidos.' using errcode = '22023';
      end if;
      if lote.cantidad_disponible < pedido.cantidad then
        raise exception 'No hay stock suficiente para aceptar este pedido.' using errcode = '22023';
      end if;
      update public.lotes set cantidad_disponible = cantidad_disponible - pedido.cantidad where id = lote.id;
    else
      if lote.cantidad_disponible + pedido.cantidad > 99999999999.999 then
        raise exception 'Ajusta el stock del lote antes de devolver esta cantidad.' using errcode = '22023';
      end if;
      update public.lotes set cantidad_disponible = cantidad_disponible + pedido.cantidad where id = lote.id;
    end if;
  end if;
  update public.pedidos set estado = p_estado, actualizado_en = now(),
    motivo = case when p_estado in ('rechazado', 'cancelado') then v_motivo else null end,
    recibido_en = case when p_estado = 'recibido' then now() else recibido_en end
  where id = pedido.id returning * into pedido;
  perform private.notificar_pedido(pedido);
  return pedido.id;
end;
$$;

-- Reputación en el catálogo: promedio solo con 3 o más calificaciones visibles.
create or replace view public.catalogo_lotes with (security_barrier = true) as
select l.*, p.nombre_completo as productor_nombre,
  case
    when exists(select 1 from public.tests_residuos t where t.lote_id = l.id and t.resultado = 'pasa') then 3
    when exists(select 1 from public.inspecciones_dron d where d.lote_id = l.id and d.estado = 'completado') then 2
    when exists(select 1 from public.certificados c where c.lote_id = l.id and c.estado = 'aprobado'
      and c.fecha_vencimiento >= (now() at time zone 'America/Lima')::date) then 1
    else 0 end::integer as nivel_sello,
  r.total as productor_calificaciones,
  case when r.total >= 3 then r.promedio end as productor_promedio
from public.lotes l join public.perfiles p on p.id = l.productor_id
cross join lateral (select count(*)::integer as total, round(avg(c.estrellas), 1) as promedio
  from public.calificaciones c where c.calificado_a = l.productor_id and c.rol_calificador = 'comprador'
    and private.calificacion_visible(c.visible, c.pedido_id)) r
where private.lote_publicable(l.id);

create or replace function public.metricas_admin() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  inicio timestamptz := date_trunc('month', now() at time zone 'America/Lima') at time zone 'America/Lima';
  fin timestamptz := (date_trunc('month', now() at time zone 'America/Lima') + interval '1 month') at time zone 'America/Lima';
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador activo puede consultar estas métricas.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'lotes_activos', (select count(*) from public.catalogo_lotes),
    'pedidos_mes', (select count(*) from public.pedidos where creado_en >= inicio and creado_en < fin),
    'usuarios_nuevos', (select count(*) from public.perfiles where rol <> 'admin' and creado_en >= inicio and creado_en < fin),
    'certificados_pendientes', (select count(*) from public.certificados where estado = 'en_revision'),
    'drones_pendientes', (select count(*) from public.inspecciones_dron where estado = 'solicitado'),
    'lotes_bloqueados', (select count(distinct lote_id) from public.tests_residuos where resultado = 'no_pasa'),
    'vendedores_en_revision', (select count(*) from public.vendedores_en_revision()),
    'mes_desde', (inicio at time zone 'America/Lima')::date::text
  );
end;
$$;

revoke all on function private.cierre_calificacion(timestamptz), private.calificacion_visible(boolean, uuid),
  private.proteger_calificacion(), private.resumen_reputacion(uuid) from public, anon, authenticated;
grant execute on function private.calificacion_visible(boolean, uuid) to anon, authenticated;
revoke all on function public.perfil_productor(uuid), public.estado_calificacion_pedido(uuid),
  public.calificar_pedido(uuid, integer, text), public.publicar_calificaciones_vencidas(),
  public.vendedores_en_revision(), public.cambiar_estado_pedido(uuid, public.estado_pedido, text)
  from public, anon, authenticated;
grant execute on function public.perfil_productor(uuid) to anon, authenticated;
grant execute on function public.estado_calificacion_pedido(uuid), public.calificar_pedido(uuid, integer, text),
  public.vendedores_en_revision(), public.cambiar_estado_pedido(uuid, public.estado_pedido, text) to authenticated;
grant execute on function public.publicar_calificaciones_vencidas() to service_role;

comment on table public.calificaciones is 'Una calificación por parte y pedido, inmutable. Doble ciego: visible cuando ambas califican o al cerrar la ventana de 14 días.';
comment on column public.pedidos.recibido_en is 'Inicio de la ventana de calificación. Pedidos previos al lanzamiento usan private.hitos.lanzamiento_calificaciones.';
commit;
