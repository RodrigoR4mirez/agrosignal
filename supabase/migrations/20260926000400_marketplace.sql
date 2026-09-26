begin;

-- Existing lots keep their current visibility; new UI lots start as drafts.
alter table public.lotes add column borrador boolean not null default false;

create or replace function private.lote_publicable(lote uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.lotes l
    join public.perfiles p on p.id = l.productor_id
    join auth.users u on u.id = p.id
    where l.id = lote and not l.bloqueado and not l.borrador and l.cantidad_disponible > 0
      and not p.suspendido and p.rol = 'productor' and u.email_confirmed_at is not null
      and not exists (select 1 from public.tests_residuos t
        where t.lote_id = l.id and t.resultado = 'no_pasa')
  )
$$;

-- Column grants prevent ownership changes, unblocking, and forged timestamps.
grant insert (id, productor_id, cultivo, region, provincia, distrito,
  cantidad_disponible, unidad, precio_unidad, estado_cosecha, nivel_riesgo,
  destino, descripcion, fotos, borrador) on public.lotes to authenticated;
grant update (cultivo, region, provincia, distrito, cantidad_disponible, unidad,
  precio_unidad, estado_cosecha, nivel_riesgo, destino, descripcion, fotos, borrador)
  on public.lotes to authenticated;
grant delete on public.lotes to authenticated;
create policy lotes_crear on public.lotes for insert to authenticated
  with check (productor_id = (select auth.uid()) and private.rol_actual() = 'productor'
    and borrador and cantidad_disponible = 0 and cardinality(fotos) = 0);
create policy lotes_editar on public.lotes for update to authenticated
  using (private.es_dueno_lote(id))
  with check (productor_id = (select auth.uid()) and private.rol_actual() = 'productor');
create policy lotes_eliminar on public.lotes for delete to authenticated
  using (private.es_dueno_lote(id));

create function private.ruta_foto_valida(ruta text, productor uuid, lote uuid) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(ruta ~ ('^' || productor::text || '/' || lote::text ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'), false)
$$;

-- Only saved Storage objects belonging to this lot may appear in its gallery.
create function private.validar_fotos_lote() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not new.borrador and cardinality(new.fotos) = 0 then
    raise exception 'Agrega al menos una foto antes de publicar.' using errcode = '22023';
  end if;
  if cardinality(new.fotos) <> (select count(distinct ruta) from unnest(new.fotos) ruta)
    or exists (select 1 from unnest(new.fotos) ruta where
      not private.ruta_foto_valida(ruta, new.productor_id, new.id)
      or not exists (select 1 from storage.objects o where o.bucket_id = 'fotos-lotes' and o.name = ruta)) then
    raise exception 'Las fotos deben pertenecer a este lote y estar guardadas.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger validar_fotos_lote before insert or update of fotos, borrador on public.lotes
  for each row execute function private.validar_fotos_lote();
revoke all on function private.ruta_foto_valida(text, uuid, uuid), private.validar_fotos_lote()
  from public, anon, authenticated;

-- Keep the existing certificate upload rule; photos use the stricter owner rule.
drop policy agrosignal_productor_subida on storage.objects;
create policy agrosignal_productor_subida on storage.objects for insert to authenticated
  with check (bucket_id = 'certificados' and private.acceso_archivo(name));
create function private.puede_subir_foto(ruta text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lotes l where private.es_dueno_lote(l.id)
    and private.ruta_foto_valida(ruta, l.productor_id, l.id))
$$;
create function private.puede_borrar_foto(ruta text) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.rol_actual() = 'productor'
    and split_part(ruta, '/', 1) = (select auth.uid())::text
    and not exists (select 1 from public.lotes l where ruta = any(l.fotos))
$$;
revoke all on function private.puede_subir_foto(text), private.puede_borrar_foto(text) from public;
grant execute on function private.puede_subir_foto(text), private.puede_borrar_foto(text) to authenticated;
create policy agrosignal_fotos_subida on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-lotes' and private.puede_subir_foto(name));
create policy agrosignal_fotos_limpieza on storage.objects for delete to authenticated
  using (bucket_id = 'fotos-lotes' and private.puede_borrar_foto(name));

-- This intentionally owner-executed view exposes ONLY publicable lots, including
-- when the caller owns a hidden lot or is admin. No contact/private evidence leaks.
create view public.catalogo_lotes with (security_barrier = true) as
select l.*, p.nombre_completo as productor_nombre,
  case
    when exists (select 1 from public.tests_residuos t where t.lote_id = l.id and t.resultado = 'pasa') then 3
    when exists (select 1 from public.inspecciones_dron d where d.lote_id = l.id and d.estado = 'completado') then 2
    when exists (select 1 from public.certificados c where c.lote_id = l.id
      and c.estado = 'aprobado' and c.fecha_vencimiento >= current_date) then 1
    else 0
  end::integer as nivel_sello
from public.lotes l join public.perfiles p on p.id = l.productor_id
where private.lote_publicable(l.id);
revoke all on public.catalogo_lotes from public, anon, authenticated;
grant select on public.catalogo_lotes to anon, authenticated;
comment on view public.catalogo_lotes is 'Catálogo público estricto. Sello calculado de solo lectura; evidencia y workflows permanecen privados.';

commit;
