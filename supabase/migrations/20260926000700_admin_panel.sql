begin;

-- Moderation stays with the account; each decision is appended, never replaced.
alter table public.perfiles
  add column moderacion_version integer not null default 0 check (moderacion_version >= 0),
  add column moderacion_motivo text check (char_length(moderacion_motivo) between 3 and 1000),
  add column moderacion_en timestamptz,
  add column moderacion_por uuid references public.perfiles(id),
  add column moderacion_historial jsonb not null default '[]'::jsonb
    check (jsonb_typeof(moderacion_historial) = 'array');

alter table public.pedidos
  add column resolucion text check (char_length(resolucion) between 10 and 1000),
  add column resolucion_accion text check (resolucion_accion in ('acuerdo', 'cancelar')),
  add column resolucion_estado_inicial public.estado_pedido,
  add column resuelto_por uuid references public.perfiles(id),
  add column resuelto_en timestamptz,
  add column resolucion_idempotencia uuid,
  add constraint resolucion_completa check (
    (resolucion is null and resolucion_accion is null and resolucion_estado_inicial is null
      and resuelto_por is null and resuelto_en is null and resolucion_idempotencia is null)
    or (resolucion is not null and resolucion_accion is not null and resolucion_estado_inicial is not null
      and resuelto_por is not null and resuelto_en is not null and resolucion_idempotencia is not null)
  );

create index perfiles_admin_idx on public.perfiles(rol, suspendido, creado_en desc);
create index certificados_pendientes_idx on public.certificados(creado_en, id) where estado = 'en_revision';
create index inspecciones_pendientes_idx on public.inspecciones_dron(creado_en, id) where estado = 'solicitado';
create index tests_fallidos_idx on public.tests_residuos(creado_en desc, id) where resultado = 'no_pasa';

create function private.proteger_historial_moderacion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.moderacion_historial is distinct from old.moderacion_historial
    or new.moderacion_version is distinct from old.moderacion_version
    or new.moderacion_motivo is distinct from old.moderacion_motivo
    or new.moderacion_por is distinct from old.moderacion_por
    or new.moderacion_en is distinct from old.moderacion_en then
    if new.moderacion_version <> old.moderacion_version + 1
      or jsonb_array_length(new.moderacion_historial) <> jsonb_array_length(old.moderacion_historial) + 1
      or new.moderacion_historial - (jsonb_array_length(new.moderacion_historial) - 1) <> old.moderacion_historial
      or new.moderacion_motivo is null or new.moderacion_por is null or new.moderacion_en is null then
      raise exception 'El historial de moderación se conserva; registra una nueva decisión.' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.proteger_historial_moderacion() from public, anon, authenticated;
create trigger proteger_historial_moderacion before update on public.perfiles
  for each row execute function private.proteger_historial_moderacion();

create function private.proteger_resolucion_pedido() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.resolucion is not null and (tg_op = 'DELETE' or
    (new.resolucion, new.resolucion_accion, new.resolucion_estado_inicial, new.resuelto_por, new.resuelto_en, new.resolucion_idempotencia)
    is distinct from
    (old.resolucion, old.resolucion_accion, old.resolucion_estado_inicial, old.resuelto_por, old.resuelto_en, old.resolucion_idempotencia)) then
    raise exception 'La resolución ya registrada se conserva en el historial del pedido.' using errcode = '22023';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.proteger_resolucion_pedido() from public, anon, authenticated;
create trigger proteger_resolucion_pedido before update or delete on public.pedidos
  for each row execute function private.proteger_resolucion_pedido();

create function public.moderar_usuario(
  p_usuario_id uuid, p_suspendido boolean, p_motivo text,
  p_version_esperada integer, p_idempotencia uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  perfil public.perfiles;
  motivo text := btrim(p_motivo);
  anterior jsonb;
  momento timestamptz := now();
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador activo puede moderar cuentas.' using errcode = '42501';
  end if;
  if p_usuario_id is null or p_suspendido is null or p_idempotencia is null
    or p_version_esperada is null or p_version_esperada < 0
    or coalesce(char_length(motivo), 0) not between 3 and 1000 then
    raise exception 'Indica la cuenta y un motivo de entre 3 y 1000 caracteres.' using errcode = '22023';
  end if;
  select * into perfil from public.perfiles where id = p_usuario_id for update;
  if not found or perfil.rol = 'admin' or perfil.id = auth.uid() then
    raise exception 'Solo puedes moderar cuentas de productores y compradores.' using errcode = '42501';
  end if;
  select value into anterior from jsonb_array_elements(perfil.moderacion_historial)
    where value->>'idempotencia' = p_idempotencia::text;
  if found then
    if anterior->>'motivo' is distinct from motivo
      or (anterior->>'suspendido')::boolean is distinct from p_suspendido
      or (anterior->>'version_anterior')::integer is distinct from p_version_esperada
      or anterior->>'administrador_id' is distinct from auth.uid()::text then
      raise exception 'Esta solicitud ya se utilizó. Actualiza la página antes de otra decisión.' using errcode = '22023';
    end if;
    return perfil.id;
  end if;
  if perfil.moderacion_version <> p_version_esperada or perfil.suspendido = p_suspendido then
    raise exception 'La cuenta cambió de estado. Actualiza la página para continuar.' using errcode = '22023';
  end if;
  update public.perfiles set suspendido = p_suspendido,
    moderacion_version = moderacion_version + 1, moderacion_motivo = motivo,
    moderacion_por = auth.uid(), moderacion_en = momento,
    moderacion_historial = moderacion_historial || jsonb_build_array(jsonb_build_object(
      'idempotencia', p_idempotencia, 'administrador_id', auth.uid(), 'fecha', momento,
      'suspendido', p_suspendido, 'motivo', motivo, 'version_anterior', p_version_esperada))
  where id = perfil.id;
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
    values (perfil.id, left(case when p_suspendido then 'Tu cuenta fue suspendida. Motivo: '
      else 'Tu cuenta fue reactivada. Motivo: ' end || motivo, 1000), 'cuenta', perfil.id);
  return perfil.id;
end;
$$;

create function public.resolver_disputa(
  p_pedido_id uuid, p_accion text, p_resolucion text,
  p_estado_esperado public.estado_pedido, p_idempotencia uuid
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  pedido public.pedidos;
  decision text := btrim(p_resolucion);
  aviso text;
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador activo puede resolver disputas.' using errcode = '42501';
  end if;
  if p_pedido_id is null or p_idempotencia is null or p_estado_esperado is null
    or p_accion is null or p_accion not in ('acuerdo', 'cancelar')
    or coalesce(char_length(decision), 0) not between 10 and 1000 then
    raise exception 'Escribe la resolución con entre 10 y 1000 caracteres y elige una acción.' using errcode = '22023';
  end if;
  select * into pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'No se encontró el pedido.' using errcode = '22023';
  end if;
  if pedido.resolucion is not null then
    if pedido.resolucion_idempotencia = p_idempotencia and pedido.resuelto_por = auth.uid()
      and pedido.resolucion = decision and pedido.resolucion_accion = p_accion
      and pedido.resolucion_estado_inicial = p_estado_esperado then return pedido.id; end if;
    raise exception 'Este pedido ya tiene una resolución. Actualiza la página para consultarla.' using errcode = '22023';
  end if;
  if pedido.estado <> p_estado_esperado then
    raise exception 'El pedido cambió de estado. Actualiza la página antes de resolverlo.' using errcode = '22023';
  end if;
  if p_accion = 'cancelar' then
    if pedido.estado not in ('pendiente', 'confirmado') then
      raise exception 'Solo se pueden cancelar pedidos pendientes o confirmados. Registra el acuerdo sin cambiar el estado.' using errcode = '22023';
    end if;
    -- Existing transaction RPC owns stock returns, state transitions and notices.
    perform public.cambiar_estado_pedido(pedido.id, 'cancelado', decision);
  end if;
  update public.pedidos set resolucion = decision, resolucion_accion = p_accion,
    resolucion_estado_inicial = pedido.estado, resuelto_por = auth.uid(), resuelto_en = now(),
    resolucion_idempotencia = p_idempotencia, actualizado_en = now()
  where id = pedido.id;
  aviso := left('Resolución del pedido ' || left(pedido.id::text, 8) || ': ' || decision, 1000);
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id) values
    (pedido.comprador_id, aviso, 'pedido', pedido.id), (pedido.productor_id, aviso, 'pedido', pedido.id);
  return pedido.id;
end;
$$;

create function public.metricas_admin() returns jsonb
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
    'mes_desde', (inicio at time zone 'America/Lima')::date::text
  );
end;
$$;

revoke all on function public.moderar_usuario(uuid, boolean, text, integer, uuid),
  public.resolver_disputa(uuid, text, text, public.estado_pedido, uuid), public.metricas_admin() from public, anon, authenticated;
grant execute on function public.moderar_usuario(uuid, boolean, text, integer, uuid),
  public.resolver_disputa(uuid, text, text, public.estado_pedido, uuid), public.metricas_admin() to authenticated;

comment on column public.perfiles.moderacion_historial is 'Historial append-only de decisiones con administrador, motivo, fecha e idempotencia.';
comment on column public.pedidos.resolucion is 'Acuerdo único e inmutable registrado por admin; no procesa pagos ni devoluciones monetarias.';

commit;
