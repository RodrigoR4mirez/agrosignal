begin;

alter table public.certificados add column creado_en timestamptz not null default now();
alter table public.certificados add column revisado_en timestamptz;
alter table public.inspecciones_dron add column creado_en timestamptz not null default now();
alter table public.inspecciones_dron add column completado_por uuid references public.perfiles(id);
alter table public.inspecciones_dron add column completado_en timestamptz;
alter table public.tests_residuos add column creado_en timestamptz not null default now();
create unique index certificado_archivo_unico on public.certificados(archivo_url);
create unique index test_evidencia_unica on public.tests_residuos(foto_evidencia_url);
create unique index dron_solicitud_pendiente on public.inspecciones_dron(lote_id) where estado = 'solicitado';

-- Evidence tables are mutated only through the small authorized RPC surface.
revoke insert, update, delete on public.certificados, public.inspecciones_dron, public.tests_residuos from anon, authenticated;

create function private.hoy_lima() returns date
language sql stable set search_path = '' as $$ select (now() at time zone 'America/Lima')::date $$;

create function private.ruta_evidencia_valida(ruta text, productor uuid, lote uuid, bucket text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(ruta ~ ('^' || productor::text || '/' || lote::text ||
    '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(' ||
    case bucket when 'certificados' then 'pdf|jpg|jpeg|png|webp'
      when 'evidencia-drones' then 'jpg|jpeg|png|webp|mp4'
      when 'evidencia-tests' then 'jpg|jpeg|png|webp' else 'INVALID' end || ')$'), false)
$$;

create function private.validar_objeto_evidencia(ruta text, lote uuid, bucket text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lotes l join storage.objects o on o.bucket_id = bucket and o.name = ruta
    where l.id = lote and private.ruta_evidencia_valida(ruta, l.productor_id, l.id, bucket)
      and o.metadata->>'mimetype' = case lower(substring(ruta from '\.([^.]+)$'))
        when 'pdf' then 'application/pdf' when 'jpg' then 'image/jpeg' when 'jpeg' then 'image/jpeg'
        when 'png' then 'image/png' when 'webp' then 'image/webp' when 'mp4' then 'video/mp4' end
      and case when o.metadata->>'size' ~ '^[0-9]{1,12}$' then (o.metadata->>'size')::bigint
        between 1 and case bucket when 'certificados' then 10485760 when 'evidencia-drones' then 52428800 else 5242880 end
        else false end)
$$;

create function private.puede_subir_evidencia(ruta text, bucket text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lotes l
    where private.ruta_evidencia_valida(ruta, l.productor_id, l.id, bucket)
      and ((bucket = 'certificados' and private.es_dueno_lote(l.id))
        or (bucket in ('evidencia-drones', 'evidencia-tests') and private.es_admin())))
$$;
drop policy agrosignal_productor_subida on storage.objects;
drop policy agrosignal_admin_evidencias on storage.objects;
create policy agrosignal_evidencias_subida on storage.objects for insert to authenticated
  with check (bucket_id in ('certificados', 'evidencia-drones', 'evidencia-tests')
    and private.puede_subir_evidencia(name, bucket_id));
-- No UPDATE or DELETE policy for private evidence: signed URLs never bypass this.

create function private.notificar_sello(lote uuid, mensaje text, incluir_admin boolean default false) returns void
language sql security definer set search_path = '' as $$
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  select p.id, mensaje, 'sello', lote from public.perfiles p
  where p.id = (select productor_id from public.lotes where id = lote)
    or (incluir_admin and p.rol = 'admin' and not p.suspendido
      and exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null))
$$;

create function public.subir_certificado(p_lote_id uuid, p_tipo public.tipo_certificado, p_numero text,
  p_fecha_vencimiento date, p_archivo_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; existente public.certificados;
begin
  if not private.es_dueno_lote(p_lote_id) then
    raise exception 'Solo el productor de este lote puede enviar certificados.' using errcode = '42501';
  end if;
  perform 1 from public.lotes where id = p_lote_id for update;
  if p_tipo is null or coalesce(char_length(btrim(p_numero)), 0) not between 1 and 100
    or p_fecha_vencimiento is null or p_fecha_vencimiento < private.hoy_lima()
    or p_fecha_vencimiento > private.hoy_lima() + interval '20 years'
    or not private.validar_objeto_evidencia(p_archivo_path, p_lote_id, 'certificados') then
    raise exception 'Revisa el número, la vigencia y el archivo del certificado.' using errcode = '22023';
  end if;
  select * into existente from public.certificados where archivo_url = p_archivo_path;
  if found then
    if existente.lote_id = p_lote_id and existente.tipo = p_tipo and existente.numero = btrim(p_numero)
      and existente.fecha_vencimiento = p_fecha_vencimiento then return existente.id; end if;
    raise exception 'Este archivo ya corresponde a otro certificado.' using errcode = '22023';
  end if;
  insert into public.certificados(lote_id,tipo,numero,fecha_vencimiento,archivo_url)
    values(p_lote_id,p_tipo,btrim(p_numero),p_fecha_vencimiento,p_archivo_path) returning id into v_id;
  perform private.notificar_sello(p_lote_id, 'Recibimos un certificado del lote para revisión.', true);
  return v_id;
end;
$$;

create function public.revisar_certificado(p_certificado_id uuid, p_estado public.estado_certificado,
  p_motivo text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare certificado public.certificados; motivo text := nullif(btrim(p_motivo), '');
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador puede revisar certificados.' using errcode = '42501';
  end if;
  if p_estado is null or p_estado not in ('aprobado','rechazado')
    or (p_estado = 'rechazado' and coalesce(char_length(motivo),0) not between 3 and 1000)
    or (p_estado = 'aprobado' and motivo is not null) then
    raise exception 'Elige aprobar o rechazar; el rechazo necesita un motivo de 3 a 1000 caracteres.' using errcode = '22023';
  end if;
  select * into certificado from public.certificados where id = p_certificado_id for update;
  if not found then raise exception 'No se encontró el certificado.' using errcode = '42501'; end if;
  if certificado.estado = p_estado and certificado.motivo_rechazo is not distinct from motivo then return certificado.id; end if;
  if certificado.estado <> 'en_revision' then
    raise exception 'Este certificado ya fue revisado. Envía un documento nuevo para una nueva revisión.' using errcode = '22023';
  end if;
  if p_estado = 'aprobado' and certificado.fecha_vencimiento < private.hoy_lima() then
    raise exception 'El certificado ya venció. Solicita uno vigente.' using errcode = '22023';
  end if;
  update public.certificados set estado = p_estado, revisado_por = auth.uid(), revisado_en = now(), motivo_rechazo = motivo
    where id = certificado.id;
  perform private.notificar_sello(certificado.lote_id, case p_estado when 'aprobado'
    then 'El certificado de tu lote fue aprobado.' else 'El certificado de tu lote fue rechazado. Revisa el motivo en las verificaciones.' end);
  return certificado.id;
end;
$$;

create function public.solicitar_inspeccion_dron(p_lote_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not private.es_dueno_lote(p_lote_id) then
    raise exception 'Solo el productor de este lote puede solicitar una inspección.' using errcode = '42501';
  end if;
  perform 1 from public.lotes where id = p_lote_id for update;
  select id into v_id from public.inspecciones_dron where lote_id = p_lote_id and estado = 'solicitado';
  if found then return v_id; end if;
  insert into public.inspecciones_dron(lote_id) values (p_lote_id) returning id into v_id;
  perform private.notificar_sello(p_lote_id, 'Se solicitó una inspección con dron para el lote.', true);
  return v_id;
end;
$$;

create function public.completar_inspeccion_dron(p_inspeccion_id uuid, p_latitud numeric, p_longitud numeric,
  p_fecha_vuelo date, p_evidencia_paths text[], p_notas text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inspeccion public.inspecciones_dron; gps text;
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador puede registrar una inspección.' using errcode = '42501';
  end if;
  select * into inspeccion from public.inspecciones_dron where id = p_inspeccion_id for update;
  if not found then raise exception 'No se encontró la solicitud de inspección.' using errcode = '42501'; end if;
  if p_latitud is null or p_latitud not between -90 and 90 or p_longitud is null or p_longitud not between -180 and 180
    or p_fecha_vuelo is null or p_fecha_vuelo not between date '2000-01-01' and private.hoy_lima()
    or coalesce(cardinality(p_evidencia_paths),0) not between 1 and 6
    or cardinality(p_evidencia_paths) <> (select count(distinct ruta) from unnest(p_evidencia_paths) ruta)
    or char_length(p_notas) > 2000
    or exists(select 1 from unnest(p_evidencia_paths) ruta where
      not private.validar_objeto_evidencia(ruta, inspeccion.lote_id, 'evidencia-drones')) then
    raise exception 'Revisa las coordenadas, la fecha, las notas y las evidencias de la inspección.' using errcode = '22023';
  end if;
  gps := round(p_latitud,6)::text || ', ' || round(p_longitud,6)::text;
  if inspeccion.estado = 'completado' then
    if inspeccion.coordenadas_gps = gps and inspeccion.fecha_vuelo = p_fecha_vuelo
      and inspeccion.evidencia_urls = p_evidencia_paths and inspeccion.notas is not distinct from nullif(btrim(p_notas),'')
      then return inspeccion.id; end if;
    raise exception 'Esta inspección ya fue completada y no se puede sobrescribir.' using errcode = '22023';
  end if;
  update public.inspecciones_dron set estado = 'completado', coordenadas_gps = gps, fecha_vuelo = p_fecha_vuelo,
    evidencia_urls = p_evidencia_paths, notas = nullif(btrim(p_notas),''), completado_por = auth.uid(), completado_en = now()
    where id = inspeccion.id;
  perform private.notificar_sello(inspeccion.lote_id, 'La inspección con dron de tu lote fue completada.');
  return inspeccion.id;
end;
$$;

-- The trigger is authoritative even for trusted inserts outside the RPC.
create function private.proteger_test_residuos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then
    raise exception 'Los tests de residuos son inmutables. Registra un nuevo test para conservar el historial.' using errcode = '22023';
  end if;
  perform 1 from public.lotes where id = new.lote_id for update;
  if new.fecha_prueba not between date '2000-01-01' and private.hoy_lima()
    or not private.validar_objeto_evidencia(new.foto_evidencia_url, new.lote_id, 'evidencia-tests') then
    raise exception 'Revisa la fecha y la foto de evidencia del test.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger proteger_test_residuos before insert or update or delete on public.tests_residuos
  for each row execute function private.proteger_test_residuos();

create function private.bloquear_lote_residuos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.resultado = 'no_pasa' then
    update public.lotes set bloqueado = true where id = new.lote_id;
    perform private.notificar_sello(new.lote_id,
      'El test de residuos del lote no pasó. El lote fue bloqueado y retirado del marketplace.', true);
  else
    perform private.notificar_sello(new.lote_id, 'Se registró un test de residuos con resultado pasa para tu lote.');
  end if;
  return new;
end;
$$;
create trigger bloquear_lote_residuos after insert on public.tests_residuos
  for each row execute function private.bloquear_lote_residuos();

create function private.impedir_desbloqueo_residuos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not new.bloqueado and exists(select 1 from public.tests_residuos where lote_id = new.id and resultado = 'no_pasa') then
    raise exception 'El lote tiene un test de residuos que no pasó y debe permanecer bloqueado.' using errcode = '22023';
  end if;
  return new;
end;
$$;
create trigger impedir_desbloqueo_residuos before update of bloqueado on public.lotes
  for each row execute function private.impedir_desbloqueo_residuos();
-- Preserve protection for pre-existing failed tests as well.
update public.lotes l set bloqueado = true where not bloqueado
  and exists(select 1 from public.tests_residuos t where t.lote_id = l.id and t.resultado = 'no_pasa');

create function public.registrar_test_residuos(p_lote_id uuid, p_tipo_kit text, p_fecha_prueba date,
  p_resultado public.resultado_residuos, p_foto_path text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; existente public.tests_residuos;
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador puede registrar tests de residuos.' using errcode = '42501';
  end if;
  perform 1 from public.lotes where id = p_lote_id for update;
  if not found then raise exception 'No se encontró el lote.' using errcode = '42501'; end if;
  if coalesce(char_length(btrim(p_tipo_kit)),0) not between 2 and 120 or p_resultado is null or p_fecha_prueba is null then
    raise exception 'Completa el tipo de kit, la fecha y el resultado del test.' using errcode = '22023';
  end if;
  select * into existente from public.tests_residuos where foto_evidencia_url = p_foto_path;
  if found then
    if existente.lote_id = p_lote_id and existente.tipo_kit = btrim(p_tipo_kit)
      and existente.fecha_prueba = p_fecha_prueba and existente.resultado = p_resultado then return existente.id; end if;
    raise exception 'Esta foto ya corresponde a otro test.' using errcode = '22023';
  end if;
  insert into public.tests_residuos(lote_id,tipo_kit,fecha_prueba,resultado,foto_evidencia_url,realizado_por)
    values(p_lote_id,btrim(p_tipo_kit),p_fecha_prueba,p_resultado,p_foto_path,auth.uid()) returning id into v_id;
  return v_id;
end;
$$;

-- Check shipping against the blocked flag, not availability: a fully sold lot
-- legitimately has zero stock. Cancellation still restores reserved stock.
create function private.impedir_envio_lote_bloqueado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare lote public.lotes;
begin
  if new.estado = 'enviado' and old.estado is distinct from new.estado then
    select * into lote from public.lotes where id = new.lote_id for update;
    if lote.bloqueado or exists(select 1 from public.tests_residuos where lote_id = lote.id and resultado = 'no_pasa') then
      raise exception 'El lote está bloqueado por inocuidad. Cancela el pedido para devolver el stock.' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
create trigger impedir_envio_lote_bloqueado before update of estado on public.pedidos
  for each row execute function private.impedir_envio_lote_bloqueado();

create function private.resumen_sello(lote uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('nivel_sello', case when estados.bloqueado then 0
      when estados.residuos = 'pasa' then 3 when estados.dron = 'completado' then 2
      when estados.documental = 'aprobado' then 1 else 0 end,
    'documental', estados.documental, 'dron', estados.dron, 'residuos', estados.residuos, 'bloqueado', estados.bloqueado)
  from (select l.bloqueado,
    case when exists(select 1 from public.certificados c where c.lote_id = lote and c.estado = 'aprobado' and c.fecha_vencimiento >= private.hoy_lima()) then 'aprobado'
      when exists(select 1 from public.certificados c where c.lote_id = lote and c.estado = 'en_revision' and c.fecha_vencimiento >= private.hoy_lima()) then 'en_revision'
      when exists(select 1 from public.certificados c where c.lote_id = lote and c.estado = 'rechazado') then 'rechazado'
      when exists(select 1 from public.certificados c where c.lote_id = lote) then 'vencido' else 'sin_verificar' end as documental,
    case when exists(select 1 from public.inspecciones_dron d where d.lote_id = lote and d.estado = 'completado') then 'completado'
      when exists(select 1 from public.inspecciones_dron d where d.lote_id = lote and d.estado = 'solicitado') then 'solicitado' else 'sin_solicitar' end as dron,
    case when exists(select 1 from public.tests_residuos t where t.lote_id = lote and t.resultado = 'no_pasa') then 'no_pasa'
      when exists(select 1 from public.tests_residuos t where t.lote_id = lote and t.resultado = 'pasa') then 'pasa' else 'sin_test' end as residuos
    from public.lotes l where l.id = lote) estados
$$;
create function public.estado_sello_lote(p_lote_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select private.resumen_sello(p_lote_id) where private.lote_publicable(p_lote_id)
    or private.es_dueno_lote(p_lote_id) or private.es_admin()
$$;

create or replace view public.catalogo_lotes with (security_barrier = true) as
select l.*, p.nombre_completo as productor_nombre,
  case
    when exists(select 1 from public.tests_residuos t where t.lote_id = l.id and t.resultado = 'pasa') then 3
    when exists(select 1 from public.inspecciones_dron d where d.lote_id = l.id and d.estado = 'completado') then 2
    when exists(select 1 from public.certificados c where c.lote_id = l.id and c.estado = 'aprobado'
      and c.fecha_vencimiento >= (now() at time zone 'America/Lima')::date) then 1
    else 0 end::integer as nivel_sello
from public.lotes l join public.perfiles p on p.id = l.productor_id
where private.lote_publicable(l.id);

revoke all on function private.hoy_lima(), private.ruta_evidencia_valida(text,uuid,uuid,text),
  private.validar_objeto_evidencia(text,uuid,text), private.puede_subir_evidencia(text,text),
  private.notificar_sello(uuid,text,boolean), private.proteger_test_residuos(), private.bloquear_lote_residuos(),
  private.impedir_desbloqueo_residuos(), private.impedir_envio_lote_bloqueado(), private.resumen_sello(uuid)
  from public, anon, authenticated;
grant execute on function private.puede_subir_evidencia(text,text) to authenticated;
revoke all on function public.subir_certificado(uuid,public.tipo_certificado,text,date,text),
  public.revisar_certificado(uuid,public.estado_certificado,text), public.solicitar_inspeccion_dron(uuid),
  public.completar_inspeccion_dron(uuid,numeric,numeric,date,text[],text),
  public.registrar_test_residuos(uuid,text,date,public.resultado_residuos,text), public.estado_sello_lote(uuid)
  from public, anon, authenticated;
grant execute on function public.subir_certificado(uuid,public.tipo_certificado,text,date,text),
  public.revisar_certificado(uuid,public.estado_certificado,text), public.solicitar_inspeccion_dron(uuid),
  public.completar_inspeccion_dron(uuid,numeric,numeric,date,text[],text),
  public.registrar_test_residuos(uuid,text,date,public.resultado_residuos,text) to authenticated;
grant execute on function public.estado_sello_lote(uuid) to anon, authenticated;

comment on function public.estado_sello_lote(uuid) is 'Estados públicos mínimos; evidencia, números, coordenadas y motivos permanecen privados. Caducidad por fecha America/Lima en cada lectura.';
commit;
