import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { OrderDetail } from '@/components/transacciones/OrderDetail'
import { requireRole } from '@/lib/supabase/auth'
import { getOrder } from '@/lib/transacciones/data'
import { getEstadoCalificacion } from '@/lib/calificaciones/data'
import { uuidPattern } from '@/lib/marketplace/types'

export default async function ProducerOrder({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole('productor')
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const [{ order, error }, calificacion] = await Promise.all([getOrder(id), getEstadoCalificacion(id)])
  if (error) throw new Error('No se pudo cargar el pedido.')
  if (!order || order.productor_id !== profile.id) notFound()
  return <AppShell profile={profile}><OrderDetail order={order} role="productor" calificacion={calificacion} /></AppShell>
}
