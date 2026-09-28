begin;

-- Tablero de transacciones para la administración: indicadores, embudo, evolución semanal,
-- alertas operativas y rankings. Solo administradores activos. Importes en soles (PEN).
-- p_solo_reales excluye los pedidos de lotes de ejemplo ("[Ejemplo] …").
create function public.tablero_transacciones(p_desde date, p_hasta date, p_solo_reales boolean default false) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  inicio timestamptz := (p_desde::timestamp at time zone 'America/Lima');
  fin timestamptz := ((p_hasta + 1)::timestamp at time zone 'America/Lima');
  resultado jsonb;
begin
  if not private.es_admin() then
    raise exception 'Solo un administrador activo puede ver el tablero.' using errcode = '42501';
  end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde or p_hasta - p_desde > 800 then
    raise exception 'Revisa el rango de fechas.' using errcode = '22023';
  end if;

  with base as (
    select p.*, l.region as lote_region, coalesce(l.descripcion like '[Ejemplo] %', false) as ejemplo,
      (p.acordado_en is not null or p.estado in ('confirmado', 'enviado', 'recibido', 'calificado')) as acordado,
      (p.estado in ('enviado', 'recibido', 'calificado') or p.enviado_en is not null) as despachado,
      p.estado in ('recibido', 'calificado') as recibido
    from public.pedidos p join public.lotes l on l.id = p.lote_id
    where not (p_solo_reales and coalesce(l.descripcion like '[Ejemplo] %', false))
  ), periodo as (
    select * from base where creado_en >= inicio and creado_en < fin
  ), flujo2 as (
    select * from periodo where flujo = 2
  )
  select jsonb_build_object(
    'kpis', (select jsonb_build_object(
      'pedidos', count(*),
      'acuerdos', count(*) filter (where acordado),
      'valor_acordado', coalesce(sum(total) filter (where acordado and estado <> 'cancelado'), 0),
      'valor_pagado', coalesce(sum(total) filter (where pago_confirmado_en is not null), 0),
      'concluidos', count(*) filter (where recibido),
      'rechazados', count(*) filter (where estado = 'rechazado'),
      'cancelados', count(*) filter (where estado = 'cancelado'),
      'ticket_promedio', coalesce(round(avg(total) filter (where acordado and estado <> 'cancelado'), 2), 0),
      'horas_respuesta', round((extract(epoch from avg(acordado_en - creado_en) filter (where acordado_en is not null)) / 3600)::numeric, 1),
      'horas_hasta_pago', round((extract(epoch from avg(pago_confirmado_en - acordado_en) filter (where pago_confirmado_en is not null and acordado_en is not null)) / 3600)::numeric, 1),
      'valor_mercado_pago', coalesce(sum(total) filter (where pago_metodo = 'mercado_pago' and pago_confirmado_en is not null), 0),
      'compradores', count(distinct comprador_id), 'productores', count(distinct productor_id)
    ) from periodo),
    -- Embudo solo con pedidos del flujo de 6 fases (los anteriores no registran pago ni comprobante).
    'embudo', (select jsonb_build_array(
      jsonb_build_object('fase', 'Solicitudes', 'n', count(*)),
      jsonb_build_object('fase', 'Acuerdos', 'n', count(*) filter (where acordado)),
      jsonb_build_object('fase', 'Pago confirmado', 'n', count(*) filter (where pago_confirmado_en is not null)),
      jsonb_build_object('fase', 'Despachados', 'n', count(*) filter (where despachado)),
      jsonb_build_object('fase', 'Recibidos', 'n', count(*) filter (where recibido)),
      jsonb_build_object('fase', 'Con comprobante', 'n', count(*) filter (where comprobante_en is not null))
    ) from flujo2),
    'semanas', coalesce((select jsonb_agg(jsonb_build_object('semana', s.semana, 'pedidos', coalesce(x.pedidos, 0), 'valor', coalesce(x.valor, 0)) order by s.semana)
      from (select generate_series(date_trunc('week', p_desde::timestamp), date_trunc('week', p_hasta::timestamp), interval '1 week')::date as semana) s
      left join (select date_trunc('week', creado_en at time zone 'America/Lima')::date as semana, count(*) as pedidos,
        sum(total) filter (where acordado and estado <> 'cancelado') as valor from periodo group by 1) x on x.semana = s.semana), '[]'::jsonb),
    -- Alertas: estado actual (no depende del periodo), para actuar hoy.
    'alertas', (select jsonb_build_array(
      jsonb_build_object('clave', 'sin_respuesta', 'titulo', 'Solicitudes sin respuesta hace más de 48 h', 'ids', coalesce(jsonb_agg(id order by creado_en) filter (where estado = 'pendiente' and propuesta_en is null and creado_en < now() - interval '48 hours'), '[]')),
      jsonb_build_object('clave', 'propuesta', 'titulo', 'Contrapropuestas sin respuesta hace más de 48 h', 'ids', coalesce(jsonb_agg(id order by propuesta_en) filter (where estado = 'pendiente' and propuesta_en < now() - interval '48 hours'), '[]')),
      jsonb_build_object('clave', 'pago_sin_confirmar', 'titulo', 'Pagos informados sin confirmar hace más de 24 h', 'ids', coalesce(jsonb_agg(id order by pago_informado_en) filter (where pago_informado_en < now() - interval '24 hours' and pago_confirmado_en is null and estado not in ('cancelado', 'rechazado')), '[]')),
      jsonb_build_object('clave', 'sin_despacho', 'titulo', 'Pagados sin despachar hace más de 3 días', 'ids', coalesce(jsonb_agg(id order by pago_confirmado_en) filter (where estado = 'confirmado' and pago_confirmado_en < now() - interval '3 days'), '[]')),
      jsonb_build_object('clave', 'sin_recepcion', 'titulo', 'Enviados sin confirmar recepción hace más de 7 días', 'ids', coalesce(jsonb_agg(id order by enviado_en) filter (where estado = 'enviado' and coalesce(enviado_en, actualizado_en) < now() - interval '7 days'), '[]')),
      jsonb_build_object('clave', 'observacion', 'titulo', 'Problemas reportados por compradores', 'ids', coalesce(jsonb_agg(id order by observacion_en) filter (where observacion_en is not null and resolucion is null and estado not in ('cancelado', 'rechazado')), '[]'))
    ) from base where flujo = 2),
    'cultivos', coalesce((select jsonb_agg(t order by t.valor desc) from (select split_part(btrim(cultivo), ' ', 1) as nombre, count(*) as pedidos, sum(total) as valor
      from periodo where acordado and estado <> 'cancelado' group by 1 order by 3 desc limit 5) t), '[]'::jsonb),
    'regiones', coalesce((select jsonb_agg(t order by t.valor desc) from (select lote_region as nombre, count(*) as pedidos, sum(total) as valor
      from periodo where acordado and estado <> 'cancelado' group by 1 order by 3 desc limit 5) t), '[]'::jsonb),
    'productores', coalesce((select jsonb_agg(t order by t.valor desc) from (select productor_id as id, max(productor_nombre) as nombre, count(*) as pedidos, sum(total) as valor
      from periodo where acordado and estado <> 'cancelado' group by 1 order by 4 desc limit 5) t), '[]'::jsonb),
    'compradores', coalesce((select jsonb_agg(t order by t.valor desc) from (select comprador_id as id, max(comprador_nombre) as nombre, count(*) as pedidos, sum(total) as valor
      from periodo where acordado and estado <> 'cancelado' group by 1 order by 4 desc limit 5) t), '[]'::jsonb),
    'metodos', coalesce((select jsonb_agg(t order by t.pedidos desc) from (select coalesce(pago_metodo::text, 'sin_registro') as metodo, count(*) as pedidos, sum(total) as valor
      from periodo where pago_confirmado_en is not null group by 1) t), '[]'::jsonb),
    'transacciones', coalesce((select jsonb_agg(to_jsonb(t) order by t.creado_en desc) from (select id, cultivo, cantidad, unidad, total, estado, flujo, forma_pago,
      comprador_id, comprador_nombre, productor_id, productor_nombre, propuesta_en, pago_informado_en, pago_confirmado_en, pago_metodo, enviado_en,
      observacion_en, comprobante_en, comprobante_tipo, comprobante_numero, creado_en, ejemplo from periodo order by creado_en desc limit 50) t), '[]'::jsonb)
  ) into resultado;
  return resultado;
end;
$$;
revoke all on function public.tablero_transacciones(date, date, boolean) from public, anon;
grant execute on function public.tablero_transacciones(date, date, boolean) to authenticated;

commit;
