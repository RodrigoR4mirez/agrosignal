import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { OrderDetail } from '@/components/transacciones/OrderDetail'
import { PedidoDetalle } from '@/components/transacciones/PedidoDetalle'
import { configMercadoPago } from '@/lib/pagos/mercadopago'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/supabase/auth'
import { getOrder } from '@/lib/transacciones/data'
import { getEstadoCalificacion } from '@/lib/calificaciones/data'
import { uuidPattern } from '@/lib/marketplace/types'

export default async function BuyerOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string; pago?: string }> }) {
  const profile = await requireRole('comprador')
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const [{ order, eventos, documentos, error }, query, calificacion] = await Promise.all([getOrder(id), searchParams, getEstadoCalificacion(id)])
  if (error) throw new Error('No se pudo cargar el pedido.')
  if (!order || order.comprador_id !== profile.id) notFound()
  const pagoEnLinea = Boolean(configMercadoPago() && !order.pago_confirmado_en && ((await (await createClient()).rpc('estado_mercadopago', { p_productor_id: order.productor_id })).data as { conectado?: boolean } | null)?.conectado)
  return <AppShell profile={profile}>{order.flujo === 2
    ? <PedidoDetalle order={order} role="comprador" eventos={eventos} documentos={documentos} calificacion={calificacion} created={query.creado === '1'} pagoEnLinea={pagoEnLinea} avisoPago={query.pago} />
    : <OrderDetail order={order} role="comprador" created={query.creado === '1'} calificacion={calificacion} />}</AppShell>
}
