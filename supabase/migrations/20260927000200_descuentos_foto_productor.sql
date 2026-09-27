begin;

-- Descuento opcional por lote: el productor indica el precio anterior y el
-- catálogo muestra el porcentaje. Siempre mayor que el precio actual y sin
-- rebajas absurdas (hasta 95 %).
alter table public.lotes add column precio_anterior numeric(14,2);
alter table public.lotes add constraint lotes_precio_anterior_valido check (
  precio_anterior is null or (precio_anterior <> 'NaN'::numeric
    and precio_anterior > precio_unidad and precio_anterior <= precio_unidad * 20));
grant insert (precio_anterior), update (precio_anterior) on public.lotes to authenticated;
comment on column public.lotes.precio_anterior is 'Precio antes del descuento (opcional). El catálogo muestra el porcentaje de rebaja.';

-- Foto de perfil pública: <usuario_uuid>/<archivo_uuid.ext> en el bucket fotos-perfil.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-perfil', 'fotos-perfil', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy agrosignal_fotos_perfil_lectura on storage.objects for select to anon, authenticated
  using (bucket_id = 'fotos-perfil');
create policy agrosignal_fotos_perfil_subida on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-perfil' and split_part(name, '/', 1) = (select auth.uid())::text
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$');
create policy agrosignal_fotos_perfil_limpieza on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-perfil' and split_part(name, '/', 1) = (select auth.uid())::text);

alter table public.perfiles add column foto text;
alter table public.perfiles add constraint perfiles_foto_ruta check (
  foto is null or foto ~ ('^' || id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'));

-- La foto debe existir en el bucket antes de guardarse en el perfil.
create function private.validar_foto_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.foto is not null and new.foto is distinct from old.foto and not exists (
    select 1 from storage.objects o where o.bucket_id = 'fotos-perfil' and o.name = new.foto) then
    raise exception 'Sube la foto antes de guardarla en tu perfil.' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.validar_foto_perfil() from public, anon, authenticated;
create trigger validar_foto_perfil before update of foto on public.perfiles
  for each row execute function private.validar_foto_perfil();

-- Cada usuario activo cambia solo su propia foto (el grant limita la columna).
grant update (foto) on public.perfiles to authenticated;
create policy perfiles_foto_propia on public.perfiles for update to authenticated
  using (id = (select auth.uid()) and not suspendido)
  with check (id = (select auth.uid()));

-- El catálogo expone el precio anterior (vía l.*) y la foto del productor.
-- l.* cambia de columnas, así que la vista se recrea.
drop view public.catalogo_lotes;
create view public.catalogo_lotes with (security_barrier = true) as
select l.*, p.nombre_completo as productor_nombre,
  case
    when exists(select 1 from public.tests_residuos t where t.lote_id = l.id and t.resultado = 'pasa') then 3
    when exists(select 1 from public.inspecciones_dron d where d.lote_id = l.id and d.estado = 'completado') then 2
    when exists(select 1 from public.certificados c where c.lote_id = l.id and c.estado = 'aprobado'
      and c.fecha_vencimiento >= (now() at time zone 'America/Lima')::date) then 1
    else 0 end::integer as nivel_sello,
  r.total as productor_calificaciones,
  case when r.total >= 3 then r.promedio end as productor_promedio,
  p.foto as productor_foto
from public.lotes l join public.perfiles p on p.id = l.productor_id
cross join lateral (select count(*)::integer as total, round(avg(c.estrellas), 1) as promedio
  from public.calificaciones c where c.calificado_a = l.productor_id and c.rol_calificador = 'comprador'
    and private.calificacion_visible(c.visible, c.pedido_id)) r
where private.lote_publicable(l.id);
revoke all on public.catalogo_lotes from public, anon, authenticated;
grant select on public.catalogo_lotes to anon, authenticated;
comment on view public.catalogo_lotes is 'Catálogo público estricto. Sello calculado de solo lectura; evidencia y workflows permanecen privados.';

create or replace function public.perfil_productor(p_productor_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'nombre', p.nombre_completo, 'region', p.region,
    'cultivo_principal', p.cultivo_principal, 'creado_en', p.creado_en, 'foto', p.foto,
    'reputacion', private.resumen_reputacion(p.id))
  from public.perfiles p join auth.users u on u.id = p.id
  where p.id = p_productor_id and p.rol = 'productor' and not p.suspendido and u.email_confirmed_at is not null
$$;

commit;
