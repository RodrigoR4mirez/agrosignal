begin;

-- Snapshots keep the agreement readable when the catalog changes or hides a lot.
alter table public.pedidos
  add column productor_id uuid references public.perfiles(id),
  add column productor_nombre text,
  add column comprador_nombre text,
  add column comprador_telefono text not null default '',
  add column productor_telefono text not null default '',
  add column cultivo text,
  add column unidad public.unidad_lote,
  add column precio_unidad numeric(14,2),
  add column idempotencia uuid not null default gen_random_uuid(),
  add column motivo text check (char_length(motivo) <= 1000),
  add column actualizado_en timestamptz not null default now();

update public.pedidos p set productor_id = l.productor_id,
  productor_nombre = vendedor.nombre_completo, comprador_nombre = comprador.nombre_completo,
  productor_telefono = vendedor.telefono, comprador_telefono = comprador.telefono,
  cultivo = l.cultivo, unidad = l.unidad, precio_unidad = l.precio_unidad
from public.lotes l, public.perfiles vendedor, public.perfiles comprador
where p.lote_id = l.id and vendedor.id = l.productor_id and comprador.id = p.comprador_id;

alter table public.pedidos
  alter column productor_id set not null,
  alter column productor_nombre set not null,
  alter column comprador_nombre set not null,
  alter column cultivo set not null,
  alter column unidad set not null,
  alter column precio_unidad set not null,
  add constraint pedido_partes_distintas check (productor_id <> comprador_id),
  add constraint pedido_precio_valido check (precio_unidad > 0 and precio_unidad <> 'NaN'::numeric),
  add constraint pedido_total_calculado check (total = round(cantidad * precio_unidad, 2)),
  add constraint pedido_idempotencia unique (comprador_id, idempotencia);
create index pedidos_productor_idx on public.pedidos(productor_id, creado_en desc);

-- Reading an agreement never depends on current public catalog visibility.
drop policy pedidos_partes on public.pedidos;
create policy pedidos_partes on public.pedidos for select to authenticated
  using ((comprador_id = (select auth.uid()) and private.rol_actual() = 'comprador')
    or (productor_id = (select auth.uid()) and private.rol_actual() = 'productor')
    or private.es_admin());
revoke insert, update, delete on public.pedidos, public.notificaciones from anon, authenticated;

create function private.notificar_pedido(pedido public.pedidos) returns void
language sql security definer set search_path = '' as $$
  insert into public.notificaciones(usuario_id, mensaje, referencia_tipo, referencia_id)
  values
    (pedido.comprador_id, 'Pedido ' || left(pedido.id::text, 8) || ' de ' || pedido.cultivo || ': ' || pedido.estado::text || '.', 'pedido', pedido.id),
    (pedido.productor_id, 'Pedido ' || left(pedido.id::text, 8) || ' de ' || pedido.cultivo || ': ' || pedido.estado::text || '.', 'pedido', pedido.id)
$$;
revoke all on function private.notificar_pedido(public.pedidos) from public, anon, authenticated;

-- Stock and all its future returns must remain expressed in the same unit.
create function private.proteger_lote_con_pedidos() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.unidad is distinct from old.unidad or new.cultivo is distinct from old.cultivo)
    and exists (select 1 from public.pedidos p where p.lote_id = old.id
      and p.estado in ('pendiente', 'confirmado', 'enviado')) then
    raise exception 'No puedes cambiar el cultivo o la unidad mientras haya pedidos en curso.' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.proteger_lote_con_pedidos() from public, anon, authenticated;
create trigger proteger_lote_con_pedidos before update of unidad, cultivo on public.lotes
  for each row execute function private.proteger_lote_con_pedidos();

create function public.crear_pedido(
  p_lote_id uuid, p_cantidad numeric, p_direccion_entrega text,
  p_idempotencia uuid, p_precio_esperado numeric
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := auth.uid();
  lote public.lotes;
  pedido public.pedidos;
  monto numeric;
  direccion text := btrim(p_direccion_entrega);
begin
  if private.rol_actual() is distinct from 'comprador'::public.rol_usuario then
    raise exception 'Solo un comprador con correo verificado puede hacer pedidos.' using errcode = '42501';
  end if;
  if p_lote_id is null or p_idempotencia is null
    or p_cantidad is null or p_cantidad <= 0 or p_cantidad > 99999999999.999
    or p_cantidad <> round(p_cantidad, 3)
    or coalesce(char_length(direccion), 0) not between 8 and 500
    or p_precio_esperado is null or p_precio_esperado <= 0
    or p_precio_esperado > 999999999999.99 or p_precio_esperado <> round(p_precio_esperado, 2) then
    raise exception 'Revisa la cantidad, el precio y la dirección de entrega.' using errcode = '22023';
  end if;
  -- The same key is serialized even if two retries refer to different lots.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(usuario::text || p_idempotencia::text, 0));
  select * into pedido from public.pedidos where comprador_id = usuario and idempotencia = p_idempotencia;
  if found then
    if pedido.lote_id <> p_lote_id or pedido.cantidad <> p_cantidad or pedido.direccion_entrega <> direccion then
      raise exception 'Esta solicitud ya se usó. Abre un nuevo formulario para otro pedido.' using errcode = '22023';
    end if;
    return pedido.id;
  end if;
  select * into lote from public.lotes where id = p_lote_id for update;
  if not found or not private.lote_publicable(p_lote_id) then
    raise exception 'Este lote ya no está disponible para comprar.' using errcode = '22023';
  end if;
  if lote.productor_id = usuario then
    raise exception 'No puedes comprar tu propio lote.' using errcode = '42501';
  end if;
  if p_cantidad > lote.cantidad_disponible then
    raise exception 'La cantidad solicitada supera el stock disponible.' using errcode = '22023';
  end if;
  if lote.precio_unidad <> p_precio_esperado then
    raise exception 'El precio del lote cambió. Actualiza la página y revisa el nuevo total.' using errcode = '22023';
  end if;
  monto := round(p_cantidad * lote.precio_unidad, 2);
  if monto < 0.01 or monto > 999999999999.99 then
    raise exception 'El total debe estar entre S/ 0.01 y S/ 999,999,999,999.99.' using errcode = '22023';
  end if;
  insert into public.pedidos(lote_id, comprador_id, productor_id, comprador_nombre,
    productor_nombre, comprador_telefono, productor_telefono, cultivo, unidad, precio_unidad, cantidad, total, direccion_entrega, idempotencia)
  values (lote.id, usuario, lote.productor_id,
    (select nombre_completo from public.perfiles where id = usuario),
    (select nombre_completo from public.perfiles where id = lote.productor_id),
    (select telefono from public.perfiles where id = usuario),
    (select telefono from public.perfiles where id = lote.productor_id),
    lote.cultivo, lote.unidad, lote.precio_unidad, p_cantidad, monto, direccion, p_idempotencia)
  returning * into pedido;
  perform private.notificar_pedido(pedido);
  return pedido.id;
end;
$$;

create function public.cambiar_estado_pedido(
  p_pedido_id uuid, p_estado public.estado_pedido,
  p_motivo text default null, p_calificacion integer default null, p_comentario text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := auth.uid();
  rol public.rol_usuario := private.rol_actual();
  pedido public.pedidos;
  lote public.lotes;
  autorizado boolean := false;
  v_motivo text := nullif(btrim(p_motivo), '');
  v_comentario text := nullif(btrim(p_comentario), '');
begin
  if rol is null then
    raise exception 'Necesitas una cuenta activa con correo verificado.' using errcode = '42501';
  end if;
  select * into pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'No se encontró el pedido o no tienes permiso para verlo.' using errcode = '42501';
  end if;
  autorizado := case
    when p_estado in ('confirmado', 'rechazado', 'enviado') then rol = 'productor' and pedido.productor_id = usuario
    when p_estado in ('recibido', 'calificado') then rol = 'comprador' and pedido.comprador_id = usuario
    when p_estado = 'cancelado' then rol = 'admin'
      or (rol = 'comprador' and pedido.comprador_id = usuario)
      or (rol = 'productor' and pedido.productor_id = usuario)
    else false end;
  if not coalesce(autorizado, false) then
    raise exception 'No tienes permiso para realizar este cambio.' using errcode = '42501';
  end if;
  if p_estado = 'calificado' then
    if p_calificacion is null or p_calificacion not between 1 and 5 or char_length(v_comentario) > 1000 then
      raise exception 'Elige entre 1 y 5 estrellas y un comentario de hasta 1000 caracteres.' using errcode = '22023';
    end if;
  elsif p_calificacion is not null or v_comentario is not null then
    raise exception 'Solo puedes calificar un pedido recibido.' using errcode = '22023';
  end if;
  if p_estado in ('rechazado', 'cancelado') and (coalesce(char_length(v_motivo), 0) not between 3 and 1000) then
    raise exception 'Indica un motivo de entre 3 y 1000 caracteres.' using errcode = '22023';
  end if;
  if p_estado not in ('rechazado', 'cancelado') and v_motivo is not null then
    raise exception 'Este cambio no necesita un motivo.' using errcode = '22023';
  end if;
  -- Retrying an already completed step is a no-op, including stock and notices.
  if pedido.estado = p_estado then
    if p_estado = 'calificado' and (pedido.calificacion is distinct from p_calificacion or pedido.comentario is distinct from v_comentario) then
      raise exception 'Este pedido ya tiene una calificación y no se puede cambiar.' using errcode = '22023';
    end if;
    return pedido.id;
  end if;
  if not ((pedido.estado = 'pendiente' and p_estado in ('confirmado', 'rechazado', 'cancelado'))
    or (pedido.estado = 'confirmado' and p_estado in ('enviado', 'cancelado'))
    or (pedido.estado = 'enviado' and p_estado = 'recibido')
    or (pedido.estado = 'recibido' and p_estado = 'calificado')) then
    raise exception 'El pedido cambió de estado. Actualiza la página para continuar.' using errcode = '22023';
  end if;
  -- Serialize confirmations and returns for this lot, after locking the order.
  if p_estado = 'confirmado' or (p_estado = 'cancelado' and pedido.estado = 'confirmado') then
    select * into lote from public.lotes where id = pedido.lote_id for update;
    if p_estado = 'confirmado' then
      if not private.lote_publicable(lote.id) then
        raise exception 'Este lote ya no está disponible para confirmar pedidos.' using errcode = '22023';
      end if;
      if lote.cantidad_disponible < pedido.cantidad then
        raise exception 'No hay stock suficiente para aceptar este pedido.' using errcode = '22023';
      end if;
      update public.lotes set cantidad_disponible = cantidad_disponible - pedido.cantidad where id = lote.id;
    else
      if lote.cantidad_disponible + pedido.cantidad > 99999999999.999 then
        raise exception 'Ajusta el stock del lote antes de devolver esta cantidad.' using errcode = '22023';
      end if;
      update public.lotes set cantidad_disponible = cantidad_disponible + pedido.cantidad where id = lote.id;
    end if;
  end if;
  update public.pedidos set estado = p_estado, actualizado_en = now(),
    motivo = case when p_estado in ('rechazado', 'cancelado') then v_motivo else null end,
    calificacion = case when p_estado = 'calificado' then p_calificacion else null end,
    comentario = case when p_estado = 'calificado' then v_comentario else null end
  where id = pedido.id returning * into pedido;
  perform private.notificar_pedido(pedido);
  return pedido.id;
end;
$$;

create function public.marcar_notificacion_leida(p_notificacion_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if private.rol_actual() is null then
    raise exception 'Necesitas una cuenta activa con correo verificado.' using errcode = '42501';
  end if;
  update public.notificaciones set leida = true
    where id = p_notificacion_id and usuario_id = auth.uid();
  if not found then
    raise exception 'No se encontró la notificación.' using errcode = '42501';
  end if;
  return true;
end;
$$;

revoke all on function public.crear_pedido(uuid, numeric, text, uuid, numeric),
  public.cambiar_estado_pedido(uuid, public.estado_pedido, text, integer, text),
  public.marcar_notificacion_leida(uuid) from public, anon, authenticated;
grant execute on function public.crear_pedido(uuid, numeric, text, uuid, numeric),
  public.cambiar_estado_pedido(uuid, public.estado_pedido, text, integer, text),
  public.marcar_notificacion_leida(uuid) to authenticated;

commit;
