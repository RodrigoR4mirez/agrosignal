import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { money, quantity } from '@/lib/marketplace/types'
import type { Pedido } from '@/lib/transacciones/types'
import { OrderActions } from './OrderActions'
import { OrderStatus } from './OrderStatus'

const steps = ['pendiente', 'confirmado', 'enviado', 'recibido', 'calificado'] as const
export function OrderDetail({ order, role, created = false }: { order: Pedido; role: 'productor' | 'comprador'; created?: boolean }) {
  const base = role === 'productor' ? '/panel-productor' : '/panel-comprador'
  const phone = role === 'productor' ? order.comprador_telefono : order.productor_telefono
  const current = steps.findIndex(step => step === order.estado)
  return <div className="space-y-6">
    <Link href={base} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#1a5c2a] underline">← {role === 'productor' ? 'Mis ventas' : 'Mis compras'}</Link>
    {created && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950">Pedido creado correctamente. El productor recibió una notificación.</p>}
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="mb-2 text-xs font-semibold text-gray-500">Pedido #{order.id.slice(0, 8)}</p><h1 className="text-3xl font-extrabold text-[#1a5c2a] wrap-anywhere">{order.cultivo}</h1></div><OrderStatus state={order.estado} /></div>
    {current >= 0 && <ol aria-label="Seguimiento del pedido" className="grid grid-cols-2 gap-2 sm:grid-cols-5">{steps.map((step, index) => <li key={step} aria-current={index === current ? 'step' : undefined} className={`rounded-xl p-3 text-xs font-semibold ${index <= current ? 'bg-green-100 text-green-950' : 'bg-gray-100 text-gray-500'}`}><span aria-hidden="true">{index < current ? '✓' : index + 1} · </span>{step}</li>)}</ol>}
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="min-w-0 space-y-5"><h2 className="text-xl font-bold">Detalle de la compra</h2><dl className="space-y-4 text-sm wrap-anywhere"><div><dt className="text-gray-500">Cantidad</dt><dd className="mt-1 font-semibold">{quantity(order.cantidad)} {order.unidad}</dd></div><div><dt className="text-gray-500">Precio al enviar el pedido</dt><dd className="mt-1 font-semibold">{money(order.precio_unidad)} / {order.unidad}</dd></div><div><dt className="text-gray-500">Total del pedido</dt><dd className="mt-1 text-2xl font-extrabold text-[#1a5c2a]">{money(order.total)}</dd></div><div><dt className="text-gray-500">Creado</dt><dd className="mt-1">{new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(order.creado_en))}</dd></div></dl><p className="text-xs leading-relaxed text-gray-500">AgroSignal registra el pedido y su seguimiento. No realiza cobros en línea.</p></Card>
      <Card className="min-w-0 space-y-5"><h2 className="text-xl font-bold">Entrega y participantes</h2><dl className="space-y-4 text-sm wrap-anywhere"><div><dt className="text-gray-500">Productor</dt><dd className="mt-1 font-semibold">{order.productor_nombre}</dd></div><div><dt className="text-gray-500">Comprador</dt><dd className="mt-1 font-semibold">{order.comprador_nombre}</dd></div><div><dt className="text-gray-500">Dirección de entrega</dt><dd className="mt-1 whitespace-pre-wrap">{order.direccion_entrega}</dd></div>{phone && <div><dt className="text-gray-500">Teléfono de la contraparte</dt><dd className="mt-1 font-semibold">{phone}</dd></div>}</dl></Card>
    </div>
    {order.motivo && <Card><h2 className="mb-3 text-lg font-bold">Motivo de {order.estado === 'rechazado' ? 'rechazo' : 'cancelación'}</h2><p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{order.motivo}</p></Card>}
    {order.calificacion !== null && <Card><h2 className="mb-3 text-lg font-bold">Calificación del comprador</h2><p className="mb-3 font-bold text-[#b8860f]">{order.calificacion} de 5 estrellas</p>{order.comentario && <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{order.comentario}</p>}</Card>}
    {order.resolucion && <Card><h2 className="mb-3 text-lg font-bold">Resolución de administración</h2><p className="mb-3 text-sm text-gray-500">{order.resolucion_accion === 'cancelar' ? 'Se acordó cancelar el pedido.' : 'Acuerdo registrado sin cambiar el estado del pedido.'}</p><p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{order.resolucion}</p></Card>}
    <OrderActions order={order} role={role} />
  </div>
}
