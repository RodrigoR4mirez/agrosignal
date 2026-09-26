import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { OrderDetail } from '@/components/transacciones/OrderDetail'
import { requireRole } from '@/lib/supabase/auth'
import { getOrder } from '@/lib/transacciones/data'
import { uuidPattern } from '@/lib/marketplace/types'

export default async function BuyerOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string }> }) {
  const profile = await requireRole('comprador')
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const [{ order, error }, query] = await Promise.all([getOrder(id), searchParams])
  if (error) throw new Error('No se pudo cargar el pedido.')
  if (!order || order.comprador_id !== profile.id) notFound()
  return <AppShell profile={profile}><OrderDetail order={order} role="comprador" created={query.creado === '1'} /></AppShell>
}
