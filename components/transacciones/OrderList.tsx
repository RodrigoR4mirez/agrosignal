import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { money, quantity } from '@/lib/marketplace/types'
import type { Pedido } from '@/lib/transacciones/types'
import { siguientePaso } from '@/lib/transacciones/fases'
import { EtiquetaPedido } from './EtiquetaPedido'
import { buttonSecondaryClass, tituloBloque, tituloItem } from '@/components/ui/estilos'

export function OrderList({ orders, count, page, error, role, notificationsPage = 1 }: {
  orders: Pedido[]; count: number; page: number; error: boolean; role: 'productor' | 'comprador'; notificationsPage?: number
}) {
  const base = role === 'productor' ? '/panel-productor' : '/panel-comprador'
  return <section className="space-y-5" aria-labelledby="pedidos-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="pedidos-heading" className={tituloBloque}>{role === 'productor' ? 'Mis ventas' : 'Mis compras'}</h2><p className="text-sm text-gray-600">{count} {count === 1 ? 'pedido' : 'pedidos'}</p></div>
    {error ? <Card><p role="alert" className="text-sm text-red-800">No pudimos cargar los pedidos. Intenta nuevamente.</p></Card> : orders.length ? <div className="grid gap-5 md:grid-cols-2">{orders.map(order => <Card key={order.id} className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><h3 className={`min-w-0 wrap-anywhere ${tituloItem}`}>{order.cultivo}</h3><EtiquetaPedido order={order} /></div>
      {order.flujo === 2 && siguientePaso(order, role).quien === 'yo' && <p className="inline-flex items-center gap-2 text-xs font-semibold text-cacao"><span aria-hidden="true" className="size-2 rounded-full bg-naranja" />Te toca: {siguientePaso(order, role).texto}</p>}
      <p className="text-sm text-gray-600 wrap-anywhere">{role === 'productor' ? `Comprador: ${order.comprador_nombre}` : `Productor: ${order.productor_nombre}`}</p>
      <p className="text-sm">{quantity(order.cantidad)} {order.unidad} · <strong className="font-semibold">{money(order.total)}</strong></p>
      <p className="text-xs text-gray-500">{new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(order.creado_en))} · #{order.id.slice(0, 8)}</p>
      <Link href={`${base}/${role === 'productor' ? 'ventas' : 'pedidos'}/${order.id}`} className={buttonSecondaryClass}>Ver pedido</Link>
    </Card>)}</div> : <Card className="py-10 text-center"><h3 className={`mb-3 ${tituloItem}`}>{role === 'productor' ? 'Todavía no recibiste pedidos' : 'Todavía no tienes compras'}</h3><p className="mb-4 text-sm text-gray-600">{role === 'productor' ? 'Cuando un comprador solicite tu cosecha, aparecerá aquí para que la revises.' : 'Explora las cosechas disponibles y envía tu primer pedido.'}</p><Link href={role === 'productor' ? '/panel-productor/mis-lotes' : '/marketplace'} className="font-semibold text-petroleo underline">{role === 'productor' ? 'Gestionar mis lotes' : 'Explorar marketplace'}</Link></Card>}
    {(page > 1 || count > 12) && <nav aria-label="Páginas de pedidos" className="flex flex-wrap items-center justify-center gap-4 text-sm">{page > 1 && <Link href={`${base}?pagina=${page - 1}&avisos=${notificationsPage}`} className={buttonSecondaryClass}>Anteriores</Link>}<span>Página {page}</span>{page * 12 < count && <Link href={`${base}?pagina=${page + 1}&avisos=${notificationsPage}`} className={buttonSecondaryClass}>Siguientes</Link>}</nav>}
  </section>
}
