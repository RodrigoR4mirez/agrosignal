-- Borra TODOS los datos de ejemplo (usuarios *.ejemplo@example.com, sus lotes,
-- pedidos, notificaciones y fotos). Correr en Supabase → SQL Editor cuando ya
-- haya productores reales. No toca ningún usuario ni dato real.
begin;
create temp table ejemplo_ids on commit drop as
  select id from auth.users where email like '%.ejemplo@example.com';
delete from public.pedidos where comprador_id in (select id from ejemplo_ids)
  or productor_id in (select id from ejemplo_ids)
  or lote_id in (select id from public.lotes where productor_id in (select id from ejemplo_ids));
delete from public.certificados where lote_id in (select id from public.lotes where productor_id in (select id from ejemplo_ids));
delete from public.inspecciones_dron where lote_id in (select id from public.lotes where productor_id in (select id from ejemplo_ids));
delete from public.tests_residuos where lote_id in (select id from public.lotes where productor_id in (select id from ejemplo_ids));
delete from public.lotes where productor_id in (select id from ejemplo_ids);
-- Si Supabase rechaza borrar en storage.objects, quita estas dos líneas y borra
-- las carpetas de esos usuarios desde Storage → fotos-lotes.
delete from storage.objects where bucket_id = 'fotos-lotes'
  and split_part(name, '/', 1)::uuid in (select id from ejemplo_ids);
delete from auth.users where id in (select id from ejemplo_ids);  -- perfiles y notificaciones caen en cascada
commit;
