begin;

-- ============================================================
-- Cobro en línea con Mercado Pago (marketplace, split 1:1).
-- Cada productor conecta su cuenta por OAuth; el comprador paga en Mercado Pago y el dinero va a
-- la cuenta del productor (AgroSignal puede cobrar marketplace_fee). AgroSignal no retiene dinero.
-- ============================================================
alter type public.metodo_pago add value if not exists 'mercado_pago';

-- Tokens de cada productor. Solo el servidor los usa con la clave de servicio: sin permisos ni
-- políticas para anon/authenticated. Los tokens se guardan cifrados (AES-GCM) por la aplicación.
create table public.cuentas_mercadopago (
  productor_id uuid primary key references public.perfiles(id) on delete cascade,
  mp_user_id text not null,
  access_token_cifrado text not null,
  refresh_token_cifrado text not null,
  expira_en timestamptz not null,
  modo_prueba boolean not null default false,
  conectado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
alter table public.cuentas_mercadopago enable row level security;
revoke all on public.cuentas_mercadopago from anon, authenticated;

-- Lo que la interfaz sí puede saber: si el productor de un pedido o yo mismo tengo cuenta conectada.
create function public.estado_mercadopago(p_productor_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('conectado', c.productor_id is not null, 'conectado_en', c.conectado_en, 'modo_prueba', coalesce(c.modo_prueba, false))
  from (select p_productor_id as id) x left join public.cuentas_mercadopago c on c.productor_id = x.id
  where auth.uid() is not null
$$;
revoke all on function public.estado_mercadopago(uuid) from public, anon;
grant execute on function public.estado_mercadopago(uuid) to authenticated;

alter table public.pedidos
  add column pago_mp_preferencia text check (char_length(pago_mp_preferencia) <= 100),
  add column pago_mp_id text check (char_length(pago_mp_id) <= 40);
create unique index pedidos_pago_mp_id on public.pedidos(pago_mp_id) where pago_mp_id is not null;

-- La registra el servidor (clave de servicio) después de consultar el pago en Mercado Pago y
-- comprobar pedido, monto, moneda y estado aprobado. Idempotente por id de pago.
create function public.registrar_pago_mercadopago(p_pedido_id uuid, p_pago_id text, p_monto numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.pedidos;
begin
  select * into v from public.pedidos where id = p_pedido_id for update;
  if not found or v.flujo <> 2 then raise exception 'Pedido no válido.' using errcode = '22023'; end if;
  if v.pago_mp_id = p_pago_id then return v.id; end if;
  if v.pago_confirmado_en is not null then raise exception 'El pedido ya tiene un pago confirmado.' using errcode = '22023'; end if;
  if p_monto <> v.total or coalesce(p_pago_id, '') !~ '^[0-9]{1,30}$' then raise exception 'El pago no coincide con el pedido.' using errcode = '22023'; end if;
  if v.estado not in ('confirmado', 'enviado', 'recibido', 'calificado') then raise exception 'El pedido no admite pagos en este estado.' using errcode = '22023'; end if;
  update public.pedidos set pago_metodo = 'mercado_pago', pago_operacion = p_pago_id, pago_mp_id = p_pago_id,
    pago_informado_en = coalesce(pago_informado_en, now()), pago_confirmado_en = now(), actualizado_en = now()
  where id = v.id returning * into v;
  insert into public.pedido_eventos(pedido_id, tipo, actor_id, detalle) values (v.id, 'pago_confirmado', null, 'Mercado Pago · Operación ' || p_pago_id);
  perform private.avisar_pedido(v, v.comprador_id, 'Mercado Pago confirmó tu pago.');
  perform private.avisar_pedido(v, v.productor_id, 'el comprador pagó con Mercado Pago. Ya puedes preparar el despacho.');
  return v.id;
end;
$$;
revoke all on function public.registrar_pago_mercadopago(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.registrar_pago_mercadopago(uuid, text, numeric) to service_role;

commit;
