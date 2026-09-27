begin;

-- Perfil público del productor: su finca, experiencia, ubicación y forma de trabajar.
-- Todo es opcional; lo edita el propio usuario (grant de columnas + política de edición propia).
alter table public.perfiles
  add column finca text check (finca is null or char_length(btrim(finca)) between 2 and 80),
  add column hectareas numeric(10,2) check (hectareas is null or (hectareas > 0 and hectareas <= 100000 and hectareas <> 'NaN'::numeric)),
  add column anios_experiencia smallint check (anios_experiencia is null or anios_experiencia between 0 and 80),
  add column altitud_msnm integer check (altitud_msnm is null or altitud_msnm between 0 and 6000),
  -- Coordenadas dentro del Perú (con margen). Ambas o ninguna.
  add column latitud numeric(9,6) check (latitud is null or latitud between -18.5 and 0.2),
  add column longitud numeric(9,6) check (longitud is null or longitud between -81.5 and -68.5),
  add column sobre_mi text check (sobre_mi is null or char_length(sobre_mi) <= 600),
  add column practicas text[] not null default '{}' check (practicas <@ array['organico', 'riego_tecnificado', 'comercio_justo',
    'cosecha_manual', 'trazabilidad', 'manejo_integrado_plagas', 'agua_de_lluvia', 'semilla_nativa']::text[] and cardinality(practicas) <= 8),
  add column meses_cosecha smallint[] not null default '{}' check (meses_cosecha <@ array[1,2,3,4,5,6,7,8,9,10,11,12]::smallint[]),
  add column capacidad_mensual_kg numeric(14,2) check (capacidad_mensual_kg is null or (capacidad_mensual_kg > 0 and capacidad_mensual_kg <> 'NaN'::numeric)),
  add column entregas text[] not null default '{}' check (entregas <@ array['recojo_en_chacra', 'entrega_en_mercado', 'puesto_en_planta',
    'puesto_en_puerto']::text[]),
  add column asociacion text check (asociacion is null or char_length(btrim(asociacion)) between 2 and 120);
alter table public.perfiles add constraint perfiles_coordenadas_completas check ((latitud is null) = (longitud is null));

grant update (finca, hectareas, anios_experiencia, altitud_msnm, latitud, longitud, sobre_mi, practicas,
  meses_cosecha, capacidad_mensual_kg, entregas, asociacion) on public.perfiles to authenticated;
-- La política de la foto pasa a cubrir la edición del perfil propio (el grant sigue limitando columnas).
alter policy perfiles_foto_propia on public.perfiles rename to perfiles_edicion_propia;

-- Perfil público: datos de la finca y cifras de actividad calculadas.
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
    'reputacion', private.resumen_reputacion(p.id))
  from public.perfiles p join auth.users u on u.id = p.id
  where p.id = p_productor_id and p.rol = 'productor' and not p.suspendido and u.email_confirmed_at is not null
$$;

commit;
