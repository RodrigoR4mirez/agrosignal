-- Paso 1: estructura y lectura mínima. Las escrituras se habilitan en las
-- migraciones de cada módulo, junto con sus validaciones de negocio.
begin;

create type public.rol_usuario as enum ('admin', 'productor', 'comprador');
create type public.tipo_comprador as enum ('natural', 'empresa', 'exportador');
create type public.unidad_lote as enum ('kg', 'ton');
create type public.estado_cosecha as enum ('en_cosecha', 'proxima', 'disponible');
create type public.nivel_riesgo as enum ('bajo', 'medio', 'alto');
create type public.destino_lote as enum ('local', 'exportacion');
create type public.estado_pedido as enum (
  'pendiente', 'confirmado', 'enviado', 'recibido', 'calificado', 'rechazado', 'cancelado'
);
create type public.tipo_certificado as enum ('senasa', 'global_gap', 'otro');
create type public.estado_certificado as enum ('en_revision', 'aprobado', 'rechazado', 'vencido');
create type public.estado_inspeccion as enum ('solicitado', 'completado');
create type public.resultado_residuos as enum ('pasa', 'no_pasa');

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null check (char_length(btrim(nombre_completo)) between 2 and 120),
  telefono text not null default '' check (char_length(telefono) <= 30),
  rol public.rol_usuario not null,
  region text,
  cultivo_principal text,
  tipo_comprador public.tipo_comprador,
  destino_exportacion boolean,
  suspendido boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  productor_id uuid not null references public.perfiles(id),
  cultivo text not null check (char_length(btrim(cultivo)) between 2 and 100),
  region text not null check (char_length(btrim(region)) between 2 and 80),
  provincia text not null check (char_length(btrim(provincia)) between 2 and 80),
  distrito text not null check (char_length(btrim(distrito)) between 2 and 80),
  cantidad_disponible numeric(14,3) not null check (cantidad_disponible >= 0 and cantidad_disponible <> 'NaN'::numeric),
  unidad public.unidad_lote not null,
  precio_unidad numeric(14,2) not null check (precio_unidad > 0 and precio_unidad <> 'NaN'::numeric),
  estado_cosecha public.estado_cosecha not null default 'disponible',
  nivel_riesgo public.nivel_riesgo not null default 'medio',
  destino public.destino_lote not null default 'local',
  descripcion text check (char_length(descripcion) <= 300),
  fotos text[] not null default '{}',
  bloqueado boolean not null default false,
  creado_en timestamptz not null default now(),
  constraint maximo_fotos check (cardinality(fotos) <= 6)
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id),
  comprador_id uuid not null references public.perfiles(id),
  cantidad numeric(14,3) not null check (cantidad > 0 and cantidad <> 'NaN'::numeric),
  total numeric(18,2) not null check (total > 0 and total <> 'NaN'::numeric),
  direccion_entrega text not null check (char_length(btrim(direccion_entrega)) between 8 and 500),
  estado public.estado_pedido not null default 'pendiente',
  calificacion integer check (calificacion between 1 and 5),
  comentario text check (char_length(comentario) <= 1000),
  creado_en timestamptz not null default now(),
  constraint calificacion_corresponde_estado check (
    (estado = 'calificado' and calificacion is not null)
    or (estado <> 'calificado' and calificacion is null and comentario is null)
  )
);

create table public.certificados (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id),
  tipo public.tipo_certificado not null,
  numero text not null check (char_length(btrim(numero)) between 1 and 100),
  fecha_vencimiento date not null,
  -- Ruta permanente del objeto; no guardar URLs firmadas que caducan.
  archivo_url text not null check (char_length(btrim(archivo_url)) > 0),
  estado public.estado_certificado not null default 'en_revision',
  revisado_por uuid references public.perfiles(id),
  motivo_rechazo text check (char_length(motivo_rechazo) <= 1000),
  constraint rechazo_con_motivo check (
    estado <> 'rechazado' or coalesce(char_length(btrim(motivo_rechazo)), 0) > 0
  )
);

create table public.inspecciones_dron (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id),
  estado public.estado_inspeccion not null default 'solicitado',
  coordenadas_gps text,
  fecha_vuelo date,
  evidencia_urls text[],
  notas text check (char_length(notas) <= 2000),
  constraint inspeccion_completa check (
    estado <> 'completado' or (
      coalesce(char_length(btrim(coordenadas_gps)), 0) > 0
      and fecha_vuelo is not null and coalesce(cardinality(evidencia_urls), 0) > 0
    )
  )
);

create table public.tests_residuos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references public.lotes(id),
  tipo_kit text not null check (char_length(btrim(tipo_kit)) between 2 and 120),
  fecha_prueba date not null,
  resultado public.resultado_residuos not null,
  foto_evidencia_url text not null check (char_length(btrim(foto_evidencia_url)) > 0),
  realizado_por uuid not null references public.perfiles(id)
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  mensaje text not null check (char_length(btrim(mensaje)) between 1 and 1000),
  leida boolean not null default false,
  referencia_tipo text not null,
  referencia_id uuid not null,
  creado_en timestamptz not null default now()
);

create index lotes_productor_idx on public.lotes(productor_id);
create index lotes_catalogo_idx on public.lotes(region, destino, precio_unidad)
  where not bloqueado and cantidad_disponible > 0;
create index pedidos_comprador_idx on public.pedidos(comprador_id, creado_en desc);
create index pedidos_lote_idx on public.pedidos(lote_id);
create index pedidos_estado_idx on public.pedidos(estado, creado_en desc);
create index certificados_lote_idx on public.certificados(lote_id, estado, fecha_vencimiento);
create index certificados_revisor_idx on public.certificados(revisado_por);
create index inspecciones_lote_idx on public.inspecciones_dron(lote_id, estado);
create index tests_lote_idx on public.tests_residuos(lote_id, resultado);
create index tests_responsable_idx on public.tests_residuos(realizado_por);
create index notificaciones_usuario_idx on public.notificaciones(usuario_id, leida, creado_en desc);

-- Funciones auxiliares fuera del esquema expuesto por la API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create function private.rol_actual() returns public.rol_usuario
language sql stable security definer set search_path = '' as $$
  select p.rol from public.perfiles p
  join auth.users u on u.id = p.id
  where p.id = (select auth.uid()) and not p.suspendido
    and u.email_confirmed_at is not null
$$;

create function private.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.rol_actual() = 'admin'::public.rol_usuario, false)
$$;

create function private.es_dueno_lote(lote uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.lotes l
    where l.id = lote and l.productor_id = (select auth.uid())
      and private.rol_actual() = 'productor'::public.rol_usuario)
$$;

create function private.lote_publicable(lote uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lotes l
    join public.perfiles p on p.id = l.productor_id
    join auth.users u on u.id = p.id
    where l.id = lote and not l.bloqueado and l.cantidad_disponible > 0
      and not p.suspendido and p.rol = 'productor' and u.email_confirmed_at is not null
      and not exists (select 1 from public.tests_residuos t
        where t.lote_id = l.id and t.resultado = 'no_pasa')
  )
$$;

revoke all on function private.rol_actual(), private.es_admin(),
  private.es_dueno_lote(uuid), private.lote_publicable(uuid) from public;
grant execute on function private.rol_actual(), private.es_admin(),
  private.es_dueno_lote(uuid), private.lote_publicable(uuid) to anon, authenticated, service_role;

alter table public.perfiles enable row level security;
alter table public.lotes enable row level security;
alter table public.pedidos enable row level security;
alter table public.certificados enable row level security;
alter table public.inspecciones_dron enable row level security;
alter table public.tests_residuos enable row level security;
alter table public.notificaciones enable row level security;

revoke all on public.perfiles, public.lotes, public.pedidos, public.certificados,
  public.inspecciones_dron, public.tests_residuos, public.notificaciones from public, anon, authenticated;
grant select on public.lotes to anon;
grant select on public.perfiles, public.lotes, public.pedidos, public.certificados,
  public.inspecciones_dron, public.tests_residuos, public.notificaciones to authenticated;
grant all on public.perfiles, public.lotes, public.pedidos, public.certificados,
  public.inspecciones_dron, public.tests_residuos, public.notificaciones to service_role;

create policy perfiles_lectura on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or private.es_admin());
create policy lotes_publicos on public.lotes for select to anon, authenticated
  using (private.lote_publicable(id));
create policy lotes_gestion on public.lotes for select to authenticated
  using (private.es_dueno_lote(id) or private.es_admin());
create policy pedidos_partes on public.pedidos for select to authenticated
  using ((comprador_id = (select auth.uid()) and private.rol_actual() = 'comprador')
    or private.es_dueno_lote(lote_id) or private.es_admin());
create policy certificados_privados on public.certificados for select to authenticated
  using (private.es_dueno_lote(lote_id) or private.es_admin());
create policy inspecciones_privadas on public.inspecciones_dron for select to authenticated
  using (private.es_dueno_lote(lote_id) or private.es_admin());
create policy tests_privados on public.tests_residuos for select to authenticated
  using (private.es_dueno_lote(lote_id) or private.es_admin());
create policy notificaciones_propias on public.notificaciones for select to authenticated
  using (usuario_id = (select auth.uid()) and private.rol_actual() is not null);

commit;
