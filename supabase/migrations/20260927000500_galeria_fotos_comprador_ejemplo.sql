begin;

-- Galería del lote: hasta 5 fotos (antes 6). Ningún lote tiene más de 5.
alter table public.lotes drop constraint maximo_fotos;
alter table public.lotes add constraint maximo_fotos check (cardinality(fotos) <= 5);

-- El perfil del comprador indica si es una cuenta de demostración (datos de ejemplo o
-- cuentas QA del desarrollo), para avisarlo en la interfaz como en el perfil del productor.
create or replace function public.perfil_comprador(p_comprador_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare usuario uuid := auth.uid(); resultado jsonb;
begin
  if private.rol_actual() is null or not (usuario = p_comprador_id or private.es_admin()
    or exists (select 1 from public.pedidos pe where pe.comprador_id = p_comprador_id and pe.productor_id = usuario)) then
    raise exception 'Solo ven este perfil los productores con pedidos de este comprador.' using errcode = '42501';
  end if;
  select jsonb_build_object('id', p.id, 'nombre', p.nombre_completo, 'foto', p.foto, 'region', p.region,
    'tipo_comprador', p.tipo_comprador, 'destino_exportacion', p.destino_exportacion, 'creado_en', p.creado_en,
    'empresa', p.empresa, 'rubro', p.rubro, 'cultivos_interes', p.cultivos_interes, 'volumen_mensual_kg', p.volumen_mensual_kg,
    'mercados_destino', p.mercados_destino, 'sobre_mi', p.sobre_mi,
    'ejemplo', coalesce(u.email like '%.ejemplo@example.com' or u.email like 'agrosignal.qa.%@example.com', false),
    'pedidos_completados', (select count(*) from public.pedidos pe where pe.comprador_id = p.id and pe.estado in ('recibido', 'calificado')),
    'pedidos_totales', (select count(*) from public.pedidos pe where pe.comprador_id = p.id and pe.estado <> 'rechazado'),
    'productores_distintos', (select count(distinct pe.productor_id) from public.pedidos pe where pe.comprador_id = p.id and pe.estado in ('recibido', 'calificado')),
    'reputacion', private.resumen_reputacion(p.id),
    'resenas', coalesce((select jsonb_agg(r order by r->>'creado_en' desc) from (
      select jsonb_build_object('estrellas', c.estrellas, 'comentario', c.comentario, 'creado_en', c.creado_en,
        'autor', split_part(a.nombre_completo, ' ', 1) || ' ' || left(split_part(a.nombre_completo, ' ', 2), 1) || '.') r
      from public.calificaciones c join public.perfiles a on a.id = c.calificado_por
      where c.calificado_a = p.id and c.rol_calificador = 'productor' and private.calificacion_visible(c.visible, c.pedido_id)
      order by c.creado_en desc limit 10) x), '[]'::jsonb))
  into resultado from public.perfiles p left join auth.users u on u.id = p.id where p.id = p_comprador_id and p.rol = 'comprador';
  return resultado;
end;
$$;

commit;
