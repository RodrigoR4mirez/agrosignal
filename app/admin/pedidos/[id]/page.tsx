import Link from 'next/link'
import { randomUUID } from 'node:crypto'
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { AdminHeading, QueueEmpty, adminDate, adminLink } from '@/components/admin/AdminUI'
import { DisputeForm } from '@/components/admin/AdminForms'
import { OrderStatus } from '@/components/transacciones/OrderStatus'
import { getAdminOrder } from '@/lib/admin/data'
import { money, quantity } from '@/lib/marketplace/types'
import { requireRole } from '@/lib/supabase/auth'

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const { order, error } = await getAdminOrder(id)
  if (error) return <QueueEmpty error>No pudimos cargar el pedido.</QueueEmpty>
  if (!order) notFound()
  return <div className="space-y-6"><Link href="/admin/pedidos" className={adminLink}>← Pedidos y disputas</Link><AdminHeading title={`Pedido #${order.id.slice(0, 8)}`} description="Revisa los datos de la compra y coordina con ambas partes antes de registrar una decisión." /><OrderStatus state={order.estado} />
    <div className="grid gap-5 xl:grid-cols-2"><Card className="min-w-0 space-y-4"><h2 className="text-xl font-bold wrap-anywhere">{order.cultivo}</h2><dl className="space-y-4 text-sm"><div><dt className="text-gray-500">Cantidad y precio acordados</dt><dd className="mt-1 font-semibold">{quantity(order.cantidad)} {order.unidad} × {money(order.precio_unidad)}</dd></div><div><dt className="text-gray-500">Total</dt><dd className="mt-1 text-2xl font-bold text-[#1a5c2a]">{money(order.total)}</dd></div><div><dt className="text-gray-500">Creación</dt><dd className="mt-1">{adminDate(order.creado_en)}</dd></div></dl><Link href={`/verificaciones/${order.lote_id}`} className={adminLink}>Ver verificaciones del lote</Link></Card>
    <Card className="min-w-0 space-y-4"><h2 className="text-xl font-bold">Participantes y entrega</h2><dl className="space-y-4 text-sm wrap-anywhere"><div><dt className="text-gray-500">Productor</dt><dd className="mt-1 font-semibold">{order.productor_nombre}</dd><dd>{order.productor_telefono}</dd></div><div><dt className="text-gray-500">Comprador</dt><dd className="mt-1 font-semibold">{order.comprador_nombre}</dd><dd>{order.comprador_telefono}</dd></div><div><dt className="text-gray-500">Dirección acordada</dt><dd className="mt-1 whitespace-pre-wrap">{order.direccion_entrega}</dd></div></dl></Card></div>
    {order.motivo && <Card><h2 className="mb-3 text-lg font-bold">Motivo del estado actual</h2><p className="whitespace-pre-wrap text-sm wrap-anywhere">{order.motivo}</p></Card>}
    {order.calificacion !== null && <Card><h2 className="mb-3 text-lg font-bold">Calificación del comprador: {order.calificacion} de 5</h2><p className="whitespace-pre-wrap text-sm wrap-anywhere">{order.comentario}</p></Card>}
    <Card><h2 className="mb-5 text-xl font-bold">{order.resolucion ? 'Resolución registrada' : 'Resolver una disputa'}</h2>{order.resolucion ? <div className="space-y-4"><p className="text-sm font-semibold text-[#1a5c2a]">{order.resolucion_accion === 'cancelar' ? 'Cancelación del pedido' : 'Acuerdo entre las partes'}{order.resuelto_en ? ` · ${adminDate(order.resuelto_en)}` : ''}</p><p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{order.resolucion}</p><p className="text-xs text-gray-500">La resolución se conserva sin modificaciones.</p></div> : <DisputeForm id={order.id} status={order.estado} requestId={randomUUID()} />}</Card>
    <p className="text-xs leading-relaxed text-gray-500">AgroSignal no procesa cobros ni reembolsos. Las partes coordinan el pago fuera de la plataforma.</p>
  </div>
}
