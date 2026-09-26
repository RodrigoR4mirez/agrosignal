begin;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('fotos-lotes', 'fotos-lotes', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('certificados', 'certificados', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('evidencia-drones', 'evidencia-drones', false, 52428800,
    array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('evidencia-tests', 'evidencia-tests', false, 5242880,
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Estructura obligatoria: <productor_uuid>/<lote_uuid>/<archivo_uuid.ext>.
-- Comparar UUIDs como texto evita errores con rutas malformadas.
create function private.acceso_archivo(ruta text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lotes l
    where l.productor_id::text = split_part(ruta, '/', 1)
      and l.id::text = split_part(ruta, '/', 2)
      and split_part(ruta, '/', 3) <> ''
      and (private.es_dueno_lote(l.id) or private.es_admin())
  )
$$;
revoke all on function private.acceso_archivo(text) from public;
grant execute on function private.acceso_archivo(text) to authenticated, service_role;

create policy agrosignal_fotos_lectura on storage.objects for select to anon, authenticated
  using (bucket_id = 'fotos-lotes');
create policy agrosignal_evidencias_lectura on storage.objects for select to authenticated
  using (bucket_id in ('certificados', 'evidencia-drones', 'evidencia-tests')
    and private.acceso_archivo(name));
create policy agrosignal_productor_subida on storage.objects for insert to authenticated
  with check (bucket_id in ('fotos-lotes', 'certificados') and private.acceso_archivo(name));
create policy agrosignal_admin_evidencias on storage.objects for insert to authenticated
  with check (bucket_id in ('evidencia-drones', 'evidencia-tests')
    and private.es_admin() and private.acceso_archivo(name));

-- Evidencias inmutables: no permitir UPDATE/DELETE desde el navegador.
-- Los flujos de cada módulo guardarán las rutas y controlarán archivos huérfanos.
commit;
