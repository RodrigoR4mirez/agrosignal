import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { buttonPrimaryClass, tituloItem } from '@/components/ui/estilos'
import { AdminHeading, AdminPagination, QueueEmpty, adminDate, adminLink } from '@/components/admin/AdminUI'
import { OrderStatus } from '@/components/transacciones/OrderStatus'
import { inputClass } from '@/components/auth/FormFields'
import { listAdminOrders } from '@/lib/admin/data'
import { ESTADOS_PEDIDO, type EstadoPedido } from '@/lib/transacciones/types'
import { money, quantity } from '@/lib/marketplace/types'
import { requireRole } from '@/lib/supabase/auth'

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ pagina?: string; estado?: string; q?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const estado = ESTADOS_PEDIDO.includes(params.estado as EstadoPedido) ? params.estado as EstadoPedido : 'todos'
  const q = (params.q ?? '').slice(0, 100)
  const data = await listAdminOrders({ page: Number(params.pagina), estado, q })
  return <><AdminHeading title="Pedidos y disputas" description="Consulta los acuerdos de compra y registra resoluciones cuando las partes necesiten intervención." />
    <form className="adm-vidrio mb-6 grid items-end gap-4 rounded-2xl border border-linea bg-white p-5 sm:grid-cols-3"><label htmlFor="buscar-pedido" className="space-y-2 text-sm font-semibold"><span>Cultivo o código completo</span><input id="buscar-pedido" name="q" defaultValue={q} maxLength={100} className={inputClass} /></label><label htmlFor="estado-pedido" className="space-y-2 text-sm font-semibold"><span>Estado del pedido</span><select id="estado-pedido" name="estado" defaultValue={estado} className={inputClass}><option value="todos">Todos</option>{ESTADOS_PEDIDO.map(state => <option key={state} value={state}>{state.charAt(0).toUpperCase() + state.slice(1)}</option>)}</select></label><button className={buttonPrimaryClass}>Filtrar pedidos</button></form>
    <p className="mb-4 text-sm text-gray-600">{data.count} pedidos</p>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>No hay pedidos con estos filtros.</QueueEmpty> : <div className="grid gap-6 xl:grid-cols-2">{data.items.map(order => <Card key={order.id} className="min-w-0 space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className={`min-w-0 wrap-anywhere ${tituloItem}`}>{order.cultivo}</h2><OrderStatus state={order.estado} /></div><p className="text-sm text-gray-600 wrap-anywhere">Productor: {order.productor_nombre}<br />Comprador: {order.comprador_nombre}</p><p className="text-sm">{quantity(order.cantidad)} {order.unidad} · <strong className="font-semibold">{money(order.total)}</strong></p><p className="text-xs text-gray-500">{adminDate(order.creado_en)} · #{order.id.slice(0, 8)}</p>{order.resolucion && <p className="text-xs font-semibold text-petroleo">Con resolución de administración</p>}<Link href={`/admin/pedidos/${order.id}`} className={adminLink}>Revisar pedido</Link></Card>)}</div>}
    <AdminPagination base="/admin/pedidos" page={data.page} count={data.count} filters={{ estado, q }} />
  </>
}
