begin;

-- ============================================================
-- Flujo de compra en 6 fases: solicitud → acuerdo → pago → despacho → recepción → cierre.
-- El pago es directo entre las partes (transferencia, Yape/Plin o efectivo): AgroSignal no
-- cobra ni retiene dinero; registra cada paso, los documentos y un historial con fecha y hora.
-- ============================================================
create type public.forma_pago as enum ('antes_envio', 'contra_entrega');
create type public.metodo_pago as enum ('transferencia', 'yape_plin', 'efectivo');
create type public.tipo_comprobante as enum ('factura', 'boleta', 'liquidacion_compra');

alter table public.pedidos
  -- 1 = pedido anterior a este flujo (sin pago ni documentos registrados); 2 = flujo completo.
  add column flujo smallint not null default 2 check (flujo in (1, 2)),
  add column entrega text not null default 'envio' check (entrega in ('envio', 'recojo')),
  add column fecha_entrega date,
  add column forma_pago public.forma_pago not null default 'antes_envio',
  add column mensaje text check (char_length(mensaje) <= 1000),
  add column propuesta_precio numeric(12,2) check (propuesta_precio > 0),
  add column propuesta_cantidad numeric(14,3) check (propuesta_cantidad > 0),
  add column propuesta_fecha date,
  add column propuesta_forma_pago public.forma_pago,
  add column propuesta_nota text check (char_length(propuesta_nota) <= 500),
  add column propuesta_en timestamptz,
  add column acordado_en timestamptz,
  add column pago_metodo public.metodo_pago,
  add column pago_operacion text check (char_length(pago_operacion) <= 60),
  add column pago_voucher text,
  add column pago_informado_en timestamptz,
  add column pago_confirmado_en timestamptz,
  add column guia_remision text check (char_length(guia_remision) <= 40),
  add column transportista text check (char_length(transportista) <= 120),
  add column enviado_en timestamptz,
  add column observacion text check (char_length(observacion) <= 1000),
  add column observacion_en timestamptz,
  add column comprobante_tipo public.tipo_comprobante,
  add column comprobante_numero text check (char_length(comprobante_numero) <= 40),
  add column comprobante_archivo text,
  add column comprobante_en timestamptz;
update public.pedidos set flujo = 1;

-- Historial del pedido: cada paso con su autor y fecha. Solo lo ven las partes y la administración.
create table public.pedido_eventos (
  id bigint generated always as identity primary key,
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  tipo text not null check (tipo in ('solicitud', 'propuesta', 'propuesta_rechazada', 'acuerdo', 'rechazado', 'cancelado',
    'pago_informado', 'pago_confirmado', 'enviado', 'recibido', 'observacion', 'comprobante')),
  actor_id uuid references public.perfiles(id) on delete set null,
  detalle text check (char_length(detalle) <= 1000),
  creado_en timestamptz not null default clock_timestamp()
);
create index pedido_eventos_pedido on public.pedido_eventos(pedido_id, creado_en);
alter table public.pedido_eventos enable row level security;
revoke all on public.pedido_eventos from anon, authenticated;
grant select on public.pedido_eventos to authenticated;
create policy pedido_eventos_partes on public.pedido_eventos for select to authenticated using (
  private.es_admin() or exists (select 1 from public.pedidos p where p.id = pedido_id
    and (select auth.uid()) in (p.comprador_id, p.productor_id)));

create function private.evento_pedido(p_pedido uuid, p_tipo text, p_detalle text default null) returns void
language sql security definer set search_path = '' as $$
  insert into public.pedido_eventos(pedido_id, tipo, actor_id, detalle) values (p_pedido, p_tipo, auth.uid(), left(p_detalle, 1000))
$$;

create function private.avisar_pedido(p public.pedidos, p_para uuid, p_texto text) returns void
language sql security definer set search_path = '' as $$
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  values (p_para, 'Pedido ' || left(p.id::text, 8) || ' de ' || p.cultivo || ': ' || p_texto, 'pedido', p.id)
$$;

-- Reglas comunes al cambiar de estado (también para cambiar_estado_pedido, que no se modifica):
-- fecha del acuerdo, no despachar sin pago cuando se pactó "antes del envío" y registro en el historial.
create function private.reglas_estado_pedido() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado is distinct from old.estado then
    if new.estado = 'confirmado' then
      new.acordado_en := coalesce(new.acordado_en, now());
      new.propuesta_precio := null; new.propuesta_cantidad := null; new.propuesta_fecha := null;
      new.propuesta_forma_pago := null; new.propuesta_nota := null; new.propuesta_en := null;
    elsif new.estado = 'enviado' then
      if new.flujo = 2 and new.forma_pago = 'antes_envio' and new.pago_confirmado_en is null then
        raise exception 'Se acordó pagar antes del envío: confirma el pago recibido antes de despachar.' using errcode = '22023';
      end if;
      new.enviado_en := coalesce(new.enviado_en, now());
    end if;
  end if;
  return new;
end;
$$;
create trigger reglas_estado_pedido before update of estado on public.pedidos
  for each row execute function private.reglas_estado_pedido();

create function private.historial_estado_pedido() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform private.evento_pedido(new.id, 'solicitud');
  elsif new.estado is distinct from old.estado and new.estado in ('confirmado', 'rechazado', 'cancelado', 'enviado', 'recibido') then
    perform private.evento_pedido(new.id, case new.estado when 'confirmado' then 'acuerdo' else new.estado::text end,
      case when new.estado in ('rechazado', 'cancelado') then new.motivo
        when new.estado = 'enviado' then nullif(concat_ws(' · ', 'Guía ' || new.guia_remision, new.transportista), '') end);
  end if;
  return null;
end;
$$;
create trigger historial_estado_pedido after insert or update of estado on public.pedidos
  for each row execute function private.historial_estado_pedido();

-- ============================================================
-- Documentos del pedido (voucher de pago y comprobante): bucket privado.
-- Ruta obligatoria: <pedido_uuid>/<archivo_uuid>.<pdf|jpg|jpeg|png|webp>
-- ============================================================
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('documentos-pedido', 'documentos-pedido', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create function private.es_parte_pedido(p_pedido text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.pedidos p where p.id::text = p_pedido and auth.uid() in (p.comprador_id, p.productor_id))
$$;
create function private.documento_pedido_valido(p_ruta text, p_pedido uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_ruta ~ ('^' || p_pedido::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|jpg|jpeg|png|webp)$'), false)
    and exists (select 1 from storage.objects o where o.bucket_id = 'documentos-pedido' and o.name = p_ruta
      and o.metadata->>'mimetype' = case lower(substring(p_ruta from '\.([^.]+)$'))
        when 'pdf' then 'application/pdf' when 'png' then 'image/png' when 'webp' then 'image/webp' else 'image/jpeg' end)
$$;
create policy agrosignal_documentos_pedido_subida on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos-pedido' and private.es_parte_pedido(split_part(name, '/', 1)));
create policy agrosignal_documentos_pedido_lectura on storage.objects for select to authenticated
  using (bucket_id = 'documentos-pedido' and (private.es_admin() or private.es_parte_pedido(split_part(name, '/', 1))));

-- ============================================================
-- Funciones de cada fase (autenticadas, por rol y propiedad del pedido).
-- ============================================================
create function private.pedido_para(p_pedido_id uuid, p_rol public.rol_usuario) returns public.pedidos
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  if private.rol_actual() is distinct from p_rol then
    raise exception 'No tienes permiso para realizar este cambio.' using errcode = '42501';
  end if;
  select * into v from public.pedidos where id = p_pedido_id
    and (case p_rol when 'comprador' then comprador_id else productor_id end) = auth.uid() for update;
  if not found then raise exception 'No se encontró el pedido o no tienes permiso para verlo.' using errcode = '42501'; end if;
  if v.flujo <> 2 then raise exception 'Este pedido es anterior al registro de pagos y documentos.' using errcode = '22023'; end if;
  return v;
end;
$$;

-- 1. Solicitud: el pedido de siempre más las condiciones de entrega y pago.
create function public.solicitar_compra(p_lote_id uuid, p_cantidad numeric, p_direccion_entrega text, p_idempotencia uuid,
  p_precio_esperado numeric, p_entrega text, p_fecha_entrega date, p_forma_pago public.forma_pago, p_mensaje text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_entrega not in ('envio', 'recojo') or p_forma_pago is null
    or (p_fecha_entrega is not null and (p_fecha_entrega < private.hoy_lima() or p_fecha_entrega > private.hoy_lima() + 365))
    or char_length(coalesce(p_mensaje, '')) > 1000 then
    raise exception 'Revisa la entrega, la fecha y la forma de pago.' using errcode = '22023';
  end if;
  v_id := public.crear_pedido(p_lote_id, p_cantidad, p_direccion_entrega, p_idempotencia, p_precio_esperado);
  update public.pedidos set entrega = p_entrega, fecha_entrega = p_fecha_entrega, forma_pago = p_forma_pago,
    mensaje = nullif(btrim(coalesce(p_mensaje, '')), '')
  where id = v_id and estado = 'pendiente' and comprador_id = auth.uid();
  return v_id;
end;
$$;

-- 2a. El productor propone otras condiciones (precio, cantidad, fecha o forma de pago).
create function public.proponer_condiciones(p_pedido_id uuid, p_precio numeric, p_cantidad numeric, p_fecha_entrega date,
  p_forma_pago public.forma_pago, p_nota text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; disponible numeric;
begin
  v := private.pedido_para(p_pedido_id, 'productor');
  if v.estado <> 'pendiente' then raise exception 'Solo se pueden proponer cambios a una solicitud pendiente.' using errcode = '22023'; end if;
  select cantidad_disponible into disponible from public.lotes where id = v.lote_id;
  if p_precio is null or p_precio <= 0 or p_precio > 9999999999 or p_cantidad is null or p_cantidad <= 0 or p_cantidad > disponible
    or p_forma_pago is null or (p_fecha_entrega is not null and (p_fecha_entrega < private.hoy_lima() or p_fecha_entrega > private.hoy_lima() + 365))
    or char_length(coalesce(p_nota, '')) > 500 then
    raise exception 'Revisa el precio, la cantidad (hasta el stock disponible), la fecha y la forma de pago.' using errcode = '22023';
  end if;
  if round(p_precio, 2) = v.precio_unidad and p_cantidad = v.cantidad and p_fecha_entrega is not distinct from v.fecha_entrega and p_forma_pago = v.forma_pago then
    raise exception 'La propuesta es igual a la solicitud: acéptala directamente.' using errcode = '22023';
  end if;
  update public.pedidos set propuesta_precio = round(p_precio, 2), propuesta_cantidad = p_cantidad, propuesta_fecha = p_fecha_entrega,
    propuesta_forma_pago = p_forma_pago, propuesta_nota = nullif(btrim(coalesce(p_nota, '')), ''), propuesta_en = now(), actualizado_en = now()
  where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'propuesta', v.propuesta_nota);
  perform private.avisar_pedido(v, v.comprador_id, 'el productor propuso nuevas condiciones. Revísalas para cerrar el acuerdo.');
  return v.id;
end;
$$;

-- 2b. El comprador acepta la propuesta (queda el acuerdo y se descuenta stock) o la rechaza.
create function public.responder_propuesta(p_pedido_id uuid, p_aceptar boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; l public.lotes;
begin
  v := private.pedido_para(p_pedido_id, 'comprador');
  if v.estado <> 'pendiente' or v.propuesta_en is null then
    raise exception 'La propuesta ya no está disponible. Actualiza la página.' using errcode = '22023';
  end if;
  if not coalesce(p_aceptar, false) then
    update public.pedidos set propuesta_precio = null, propuesta_cantidad = null, propuesta_fecha = null, propuesta_forma_pago = null,
      propuesta_nota = null, propuesta_en = null, actualizado_en = now() where id = v.id returning * into v;
    perform private.evento_pedido(v.id, 'propuesta_rechazada');
    perform private.avisar_pedido(v, v.productor_id, 'el comprador no aceptó tu propuesta. Puedes aceptar su solicitud original, proponer otra o rechazarla.');
    return v.id;
  end if;
  select * into l from public.lotes where id = v.lote_id for update;
  if not private.lote_publicable(l.id) or l.cantidad_disponible < v.propuesta_cantidad then
    raise exception 'El lote ya no tiene stock suficiente para esta propuesta.' using errcode = '22023';
  end if;
  update public.lotes set cantidad_disponible = cantidad_disponible - v.propuesta_cantidad where id = l.id;
  update public.pedidos set precio_unidad = v.propuesta_precio, cantidad = v.propuesta_cantidad,
    total = round(v.propuesta_cantidad * v.propuesta_precio, 2), fecha_entrega = v.propuesta_fecha, forma_pago = v.propuesta_forma_pago,
    estado = 'confirmado', actualizado_en = now()
  where id = v.id returning * into v;
  perform private.notificar_pedido(v);
  return v.id;
end;
$$;

-- 3. Pago: el comprador informa (voucher obligatorio salvo efectivo) y el productor confirma.
create function public.informar_pago(p_pedido_id uuid, p_metodo public.metodo_pago, p_operacion text, p_voucher text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  v := private.pedido_para(p_pedido_id, 'comprador');
  if v.pago_confirmado_en is not null then raise exception 'El productor ya confirmó este pago.' using errcode = '22023'; end if;
  if not ((v.forma_pago = 'antes_envio' and v.estado = 'confirmado') or (v.forma_pago = 'contra_entrega' and v.estado in ('enviado', 'recibido'))) then
    raise exception 'Todavía no corresponde pagar este pedido.' using errcode = '22023';
  end if;
  if p_metodo is null or char_length(coalesce(p_operacion, '')) > 60
    or (p_metodo <> 'efectivo' and (p_voucher is null or not private.documento_pedido_valido(p_voucher, v.id)))
    or (p_voucher is not null and not private.documento_pedido_valido(p_voucher, v.id)) then
    raise exception 'Adjunta la constancia del pago (PDF o imagen) e indica el método.' using errcode = '22023';
  end if;
  update public.pedidos set pago_metodo = p_metodo, pago_operacion = nullif(btrim(coalesce(p_operacion, '')), ''), pago_voucher = p_voucher,
    pago_informado_en = now(), actualizado_en = now() where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'pago_informado', concat_ws(' · ', case v.pago_metodo when 'transferencia' then 'Transferencia'
    when 'yape_plin' then 'Yape o Plin' else 'Efectivo' end, 'Operación ' || v.pago_operacion));
  perform private.avisar_pedido(v, v.productor_id, 'el comprador informó el pago. Verifica que llegó y confírmalo.');
  return v.id;
end;
$$;

create function public.confirmar_pago(p_pedido_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  v := private.pedido_para(p_pedido_id, 'productor');
  if v.pago_confirmado_en is not null then return v.id; end if;
  if v.estado not in ('confirmado', 'enviado', 'recibido') then raise exception 'Este pedido no tiene un pago por confirmar.' using errcode = '22023'; end if;
  update public.pedidos set pago_confirmado_en = now(), actualizado_en = now() where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'pago_confirmado');
  perform private.avisar_pedido(v, v.comprador_id, 'el productor confirmó que recibió tu pago.');
  return v.id;
end;
$$;

-- 4. Despacho: guía de remisión y transportista (opcionales) y cambio a "enviado".
create function public.registrar_despacho(p_pedido_id uuid, p_guia text, p_transportista text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  v := private.pedido_para(p_pedido_id, 'productor');
  if char_length(coalesce(p_guia, '')) > 40 or char_length(coalesce(p_transportista, '')) > 120 then
    raise exception 'Revisa la guía de remisión y el transportista.' using errcode = '22023';
  end if;
  if v.estado = 'confirmado' then
    update public.pedidos set guia_remision = nullif(btrim(coalesce(p_guia, '')), ''), transportista = nullif(btrim(coalesce(p_transportista, '')), '')
    where id = v.id;
  end if;
  return public.cambiar_estado_pedido(v.id, 'enviado');
end;
$$;

-- 5. Recepción con observación: el comprador reporta un problema y se avisa a la administración.
create function public.reportar_observacion(p_pedido_id uuid, p_detalle text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  v := private.pedido_para(p_pedido_id, 'comprador');
  if v.estado not in ('enviado', 'recibido', 'calificado') then raise exception 'Puedes reportar un problema cuando el pedido ya fue enviado.' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_detalle, ''))) not between 10 and 1000 then
    raise exception 'Describe el problema en 10 a 1000 caracteres.' using errcode = '22023';
  end if;
  update public.pedidos set observacion = btrim(p_detalle), observacion_en = now(), actualizado_en = now() where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'observacion', v.observacion);
  perform private.avisar_pedido(v, v.productor_id, 'el comprador reportó un problema. La administración lo revisará con ambos.');
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  select p.id, 'Observación en el pedido ' || left(v.id::text, 8) || ' de ' || v.cultivo || '.', 'pedido', v.id
  from public.perfiles p where p.rol = 'admin' and not p.suspendido;
  return v.id;
end;
$$;

-- 6. Comprobante: factura o boleta la sube el productor; la liquidación de compra, el comprador.
create function public.registrar_comprobante(p_pedido_id uuid, p_tipo public.tipo_comprobante, p_numero text, p_archivo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  v := private.pedido_para(p_pedido_id, case when p_tipo = 'liquidacion_compra' then 'comprador' else 'productor' end::public.rol_usuario);
  if v.estado not in ('confirmado', 'enviado', 'recibido', 'calificado') then raise exception 'Primero debe existir un acuerdo.' using errcode = '22023'; end if;
  if v.comprobante_en is not null then raise exception 'Este pedido ya tiene un comprobante registrado.' using errcode = '22023'; end if;
  if coalesce(btrim(p_numero), '') !~ '^[A-Za-z0-9]{1,4}-[0-9]{1,8}$' or not private.documento_pedido_valido(p_archivo, v.id) then
    raise exception 'Indica la serie y el número (por ejemplo F001-245) y adjunta el comprobante.' using errcode = '22023';
  end if;
  update public.pedidos set comprobante_tipo = p_tipo, comprobante_numero = upper(btrim(p_numero)), comprobante_archivo = p_archivo,
    comprobante_en = now(), actualizado_en = now() where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'comprobante', case p_tipo when 'factura' then 'Factura' when 'boleta' then 'Boleta' else 'Liquidación de compra' end || ' ' || v.comprobante_numero);
  perform private.avisar_pedido(v, case when p_tipo = 'liquidacion_compra' then v.productor_id else v.comprador_id end, 'se registró el comprobante ' || v.comprobante_numero || '.');
  return v.id;
end;
$$;

revoke all on function private.evento_pedido(uuid, text, text), private.avisar_pedido(public.pedidos, uuid, text),
  private.reglas_estado_pedido(), private.historial_estado_pedido(), private.pedido_para(uuid, public.rol_usuario),
  private.documento_pedido_valido(text, uuid) from public, anon, authenticated;
revoke all on function private.es_parte_pedido(text) from public, anon;
grant execute on function private.es_parte_pedido(text) to authenticated;
revoke all on function public.solicitar_compra(uuid, numeric, text, uuid, numeric, text, date, public.forma_pago, text),
  public.proponer_condiciones(uuid, numeric, numeric, date, public.forma_pago, text), public.responder_propuesta(uuid, boolean),
  public.informar_pago(uuid, public.metodo_pago, text, text), public.confirmar_pago(uuid), public.registrar_despacho(uuid, text, text),
  public.reportar_observacion(uuid, text), public.registrar_comprobante(uuid, public.tipo_comprobante, text, text) from public, anon;
grant execute on function public.solicitar_compra(uuid, numeric, text, uuid, numeric, text, date, public.forma_pago, text),
  public.proponer_condiciones(uuid, numeric, numeric, date, public.forma_pago, text), public.responder_propuesta(uuid, boolean),
  public.informar_pago(uuid, public.metodo_pago, text, text), public.confirmar_pago(uuid), public.registrar_despacho(uuid, text, text),
  public.reportar_observacion(uuid, text), public.registrar_comprobante(uuid, public.tipo_comprobante, text, text) to authenticated;

commit;
