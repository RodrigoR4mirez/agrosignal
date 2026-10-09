begin;

-- ============================================================
-- Devoluciones: el comprador puede pedir devolver la cosecha (total o parcial) dentro de los
-- 7 días siguientes a confirmar la recepción. Si hay defecto, el flete lo paga el productor; si
-- el comprador se arrepiente, lo paga él. El reembolso es directo entre las partes, como el pago:
-- AgroSignal registra cada paso. El estado del pedido no cambia (sigue "recibido") y la cosecha
-- devuelta no vuelve al stock del lote, porque es perecible.
--
--   solicitada → aceptada → completada
--        └→ rechazada (avisa a la administración) → el admin puede forzar "aceptada"
-- ============================================================
alter table public.pedidos
  add column devolucion_estado text check (devolucion_estado in ('solicitada', 'aceptada', 'rechazada', 'completada')),
  add column devolucion_motivo text check (devolucion_motivo in ('defecto', 'arrepentimiento')),
  add column devolucion_detalle text check (char_length(devolucion_detalle) between 10 and 1000),
  add column devolucion_cantidad numeric(14,3) check (devolucion_cantidad > 0),
  add column devolucion_monto numeric(12,2) check (devolucion_monto >= 0),
  add column devolucion_respuesta text check (char_length(devolucion_respuesta) <= 1000),
  add column devolucion_solicitada_en timestamptz,
  add column devolucion_respondida_en timestamptz,
  add column devolucion_completada_en timestamptz,
  -- Revisión de la administración sobre un rechazo (una sola vez).
  add column devolucion_revision text check (char_length(devolucion_revision) <= 1000),
  add column devolucion_revisada_en timestamptz,
  add constraint devolucion_completa check (devolucion_estado is null or (devolucion_motivo is not null
    and devolucion_detalle is not null and devolucion_cantidad is not null and devolucion_monto is not null
    and devolucion_solicitada_en is not null)),
  add constraint devolucion_cantidad_pedida check (devolucion_cantidad is null or devolucion_cantidad <= cantidad);

alter table public.pedido_eventos drop constraint pedido_eventos_tipo_check;
alter table public.pedido_eventos add constraint pedido_eventos_tipo_check check (tipo in ('solicitud', 'propuesta',
  'propuesta_rechazada', 'acuerdo', 'rechazado', 'cancelado', 'pago_informado', 'pago_confirmado', 'enviado', 'recibido',
  'observacion', 'comprobante', 'devolucion_solicitada', 'devolucion_aceptada', 'devolucion_rechazada', 'devolucion_completada'));

-- Plazo para pedir la devolución: un solo lugar para cambiarlo.
create function private.cierre_devolucion(p_recibido_en timestamptz) returns timestamptz
language sql immutable set search_path = '' as $$ select p_recibido_en + interval '7 days' $$;

create function private.avisar_admins_devolucion(p public.pedidos) returns void
language sql security definer set search_path = '' as $$
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  select a.id, 'Devolución rechazada en el pedido ' || left(p.id::text, 8) || ' de ' || p.cultivo || '. Revísala.', 'pedido', p.id
  from public.perfiles a where a.rol = 'admin' and not a.suspendido
$$;

-- Comprador: pide la devolución con motivo, cantidad y detalle. Reenviar lo mismo no duplica.
create function public.solicitar_devolucion(p_pedido_id uuid, p_motivo text, p_cantidad numeric, p_detalle text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; v_detalle text := btrim(coalesce(p_detalle, ''));
begin
  v := private.pedido_para(p_pedido_id, 'comprador');
  if v.devolucion_estado is not null then
    if v.devolucion_motivo = p_motivo and v.devolucion_cantidad = p_cantidad and v.devolucion_detalle = v_detalle then return v.id; end if;
    raise exception 'Este pedido ya tiene una solicitud de devolución.' using errcode = '22023';
  end if;
  if v.estado not in ('recibido', 'calificado') or v.recibido_en is null then
    raise exception 'Puedes pedir una devolución después de confirmar la recepción.' using errcode = '22023';
  end if;
  if now() > private.cierre_devolucion(v.recibido_en) then
    raise exception 'El plazo de 7 días para pedir la devolución ya venció.' using errcode = '22023';
  end if;
  if p_motivo is null or p_motivo not in ('defecto', 'arrepentimiento') then
    raise exception 'Elige el motivo de la devolución.' using errcode = '22023';
  end if;
  if p_cantidad is null or p_cantidad <= 0 or p_cantidad > v.cantidad or p_cantidad <> round(p_cantidad, 3) then
    raise exception 'Indica una cantidad mayor que cero y no mayor que la recibida.' using errcode = '22023';
  end if;
  if char_length(v_detalle) not between 10 and 1000 then
    raise exception 'Describe el motivo en 10 a 1000 caracteres.' using errcode = '22023';
  end if;
  update public.pedidos set devolucion_estado = 'solicitada', devolucion_motivo = p_motivo, devolucion_cantidad = p_cantidad,
    devolucion_detalle = v_detalle, devolucion_solicitada_en = now(), actualizado_en = now(),
    -- Solo se reembolsa lo que ya se pagó.
    devolucion_monto = case when v.pago_confirmado_en is null then 0 else round(p_cantidad * v.precio_unidad, 2) end
  where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'devolucion_solicitada', (case p_motivo when 'defecto' then 'Defecto' else 'Arrepentimiento' end)
    || ' · ' || rtrim(to_char(p_cantidad, 'FM999999999990.999'), '.') || ' ' || v.unidad || ' · ' || v_detalle);
  perform private.avisar_pedido(v, v.productor_id, 'el comprador pidió una devolución. Acéptala o recházala con un motivo.');
  return v.id;
end;
$$;

-- Productor: acepta o rechaza (con motivo). Un rechazo pasa a la administración.
create function public.responder_devolucion(p_pedido_id uuid, p_aceptar boolean, p_respuesta text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; v_respuesta text := nullif(btrim(coalesce(p_respuesta, '')), '');
begin
  v := private.pedido_para(p_pedido_id, 'productor');
  if p_aceptar is null then raise exception 'Indica si aceptas la devolución.' using errcode = '22023'; end if;
  if v.devolucion_estado = (case when p_aceptar then 'aceptada' else 'rechazada' end) then return v.id; end if;
  if v.devolucion_estado is distinct from 'solicitada' then
    raise exception 'Esta devolución ya fue respondida.' using errcode = '22023';
  end if;
  if char_length(coalesce(v_respuesta, '')) > 1000 or (not p_aceptar and char_length(coalesce(v_respuesta, '')) < 5) then
    raise exception 'Explica el motivo del rechazo en 5 a 1000 caracteres.' using errcode = '22023';
  end if;
  update public.pedidos set devolucion_estado = case when p_aceptar then 'aceptada' else 'rechazada' end,
    devolucion_respuesta = v_respuesta, devolucion_respondida_en = now(), actualizado_en = now()
  where id = v.id returning * into v;
  perform private.evento_pedido(v.id, case when p_aceptar then 'devolucion_aceptada' else 'devolucion_rechazada' end, v_respuesta);
  if p_aceptar then
    perform private.avisar_pedido(v, v.comprador_id, 'el productor aceptó la devolución. Coordinen el retiro de la cosecha.');
  else
    perform private.avisar_pedido(v, v.comprador_id, 'el productor rechazó la devolución. La administración la revisará.');
    perform private.avisar_admins_devolucion(v);
  end if;
  return v.id;
end;
$$;

-- Productor: confirma que recibió la cosecha devuelta y reembolsó al comprador.
create function public.completar_devolucion(p_pedido_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  v := private.pedido_para(p_pedido_id, 'productor');
  if v.devolucion_estado = 'completada' then return v.id; end if;
  if v.devolucion_estado is distinct from 'aceptada' then
    raise exception 'Primero debe aceptarse la devolución.' using errcode = '22023';
  end if;
  update public.pedidos set devolucion_estado = 'completada', devolucion_completada_en = now(), actualizado_en = now()
  where id = v.id returning * into v;
  perform private.evento_pedido(v.id, 'devolucion_completada',
    case when v.devolucion_monto > 0 then 'Reembolso de S/ ' || to_char(v.devolucion_monto, 'FM999999999990.00') end);
  perform private.avisar_pedido(v, v.comprador_id, 'el productor confirmó la devolución' ||
    case when v.devolucion_monto > 0 then ' y el reembolso de S/ ' || to_char(v.devolucion_monto, 'FM999999999990.00') else '' end || '.');
  return v.id;
end;
$$;

-- Administración: revisa una devolución rechazada. Puede darla por aceptada o confirmar el rechazo.
create function public.resolver_devolucion(p_pedido_id uuid, p_aceptar boolean, p_nota text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos; v_nota text := btrim(coalesce(p_nota, ''));
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador activo puede revisar devoluciones.' using errcode = '42501';
  end if;
  if p_aceptar is null or char_length(v_nota) not between 10 and 1000 then
    raise exception 'Elige una decisión y explícala en 10 a 1000 caracteres.' using errcode = '22023';
  end if;
  select * into v from public.pedidos where id = p_pedido_id for update;
  if not found then raise exception 'No se encontró el pedido.' using errcode = '22023'; end if;
  if v.devolucion_revisada_en is not null then
    if v.devolucion_revision = v_nota and v.devolucion_estado = (case when p_aceptar then 'aceptada' else 'rechazada' end) then return v.id; end if;
    raise exception 'Esta devolución ya fue revisada por la administración.' using errcode = '22023';
  end if;
  if v.devolucion_estado is distinct from 'rechazada' then
    raise exception 'Solo se revisan devoluciones rechazadas por el productor.' using errcode = '22023';
  end if;
  update public.pedidos set devolucion_revision = v_nota, devolucion_revisada_en = now(), actualizado_en = now(),
    devolucion_estado = case when p_aceptar then 'aceptada' else 'rechazada' end
  where id = v.id returning * into v;
  if p_aceptar then
    perform private.evento_pedido(v.id, 'devolucion_aceptada', 'Administración: ' || v_nota);
    perform private.avisar_pedido(v, v.comprador_id, 'la administración aprobó tu devolución.');
    perform private.avisar_pedido(v, v.productor_id, 'la administración aprobó la devolución. Coordina el retiro y el reembolso.');
  else
    perform private.evento_pedido(v.id, 'devolucion_rechazada', 'Administración: ' || v_nota);
    perform private.avisar_pedido(v, v.comprador_id, 'la administración confirmó el rechazo de la devolución.');
    perform private.avisar_pedido(v, v.productor_id, 'la administración confirmó el rechazo de la devolución.');
  end if;
  return v.id;
end;
$$;

revoke all on function private.cierre_devolucion(timestamptz), private.avisar_admins_devolucion(public.pedidos)
  from public, anon, authenticated;
revoke all on function public.solicitar_devolucion(uuid, text, numeric, text), public.responder_devolucion(uuid, boolean, text),
  public.completar_devolucion(uuid), public.resolver_devolucion(uuid, boolean, text) from public, anon;
grant execute on function public.solicitar_devolucion(uuid, text, numeric, text), public.responder_devolucion(uuid, boolean, text),
  public.completar_devolucion(uuid), public.resolver_devolucion(uuid, boolean, text) to authenticated;

commit;
