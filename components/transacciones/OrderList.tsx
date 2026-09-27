import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { money, quantity } from '@/lib/marketplace/types'
import type { Pedido } from '@/lib/transacciones/types'
import { OrderStatus } from './OrderStatus'

export function OrderList({ orders, count, page, error, role, notificationsPage = 1 }: {
  orders: Pedido[]; count: number; page: number; error: boolean; role: 'productor' | 'comprador'; notificationsPage?: number
}) {
  const base = role === 'productor' ? '/panel-productor' : '/panel-comprador'
  return <section className="space-y-5" aria-labelledby="pedidos-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="pedidos-heading" className="text-2xl font-normal text-petroleo">{role === 'productor' ? 'Mis ventas' : 'Mis compras'}</h2><p className="text-sm text-gray-600">{count} {count === 1 ? 'pedido' : 'pedidos'}</p></div>
    {error ? <Card><p role="alert" className="text-sm text-red-800">No pudimos cargar los pedidos. Intenta nuevamente.</p></Card> : orders.length ? <div className="grid gap-5 md:grid-cols-2">{orders.map(order => <Card key={order.id} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 text-xl font-bold wrap-anywhere">{order.cultivo}</h3><OrderStatus state={order.estado} /></div>
      <p className="text-sm text-gray-600 wrap-anywhere">{role === 'productor' ? `Comprador: ${order.comprador_nombre}` : `Productor: ${order.productor_nombre}`}</p>
      <p className="text-sm">{quantity(order.cantidad)} {order.unidad} · <strong>{money(order.total)}</strong></p>
      <p className="text-xs text-gray-500">{new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(order.creado_en))} · #{order.id.slice(0, 8)}</p>
      <Link href={`${base}/${role === 'productor' ? 'ventas' : 'pedidos'}/${order.id}`} className="inline-flex min-h-11 items-center rounded-full border border-petroleo/40 px-5 text-sm font-semibold text-petroleo">Ver pedido</Link>
    </Card>)}</div> : <Card className="py-10 text-center"><h3 className="mb-3 text-lg font-bold">{role === 'productor' ? 'Todavía no recibiste pedidos' : 'Todavía no tienes compras'}</h3><p className="mb-4 text-sm text-gray-600">{role === 'productor' ? 'Cuando un comprador solicite tu cosecha, aparecerá aquí para que la revises.' : 'Explora las cosechas disponibles y envía tu primer pedido.'}</p><Link href={role === 'productor' ? '/panel-productor/mis-lotes' : '/marketplace'} className="font-semibold text-petroleo underline">{role === 'productor' ? 'Gestionar mis lotes' : 'Explorar marketplace'}</Link></Card>}
    {(page > 1 || count > 12) && <nav aria-label="Páginas de pedidos" className="flex flex-wrap items-center justify-center gap-4 text-sm">{page > 1 && <Link href={`${base}?pagina=${page - 1}&avisos=${notificationsPage}`} className="rounded-xl border border-gray-300 px-4 py-3">Anteriores</Link>}<span>Página {page}</span>{page * 12 < count && <Link href={`${base}?pagina=${page + 1}&avisos=${notificationsPage}`} className="rounded-xl border border-gray-300 px-4 py-3">Siguientes</Link>}</nav>}
  </section>
}
