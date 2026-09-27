import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IconoBrote } from '@/components/landing/Iconos'
import { BotonImprimir } from '@/components/transacciones/BotonImprimir'
import { EtiquetaPedido } from '@/components/transacciones/EtiquetaPedido'
import { requireRole } from '@/lib/supabase/auth'
import { getOrder } from '@/lib/transacciones/data'
import { money, quantity, uuidPattern } from '@/lib/marketplace/types'
import { COMPROBANTES, FORMAS_PAGO, METODOS_PAGO } from '@/lib/transacciones/types'

export const metadata: Metadata = { title: 'Orden de compra | AgroSignal', robots: { index: false } }
const fechaHora = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(v))
const fecha = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${v}T12:00:00Z`))

// Orden de compra imprimible: constancia del acuerdo para las partes y la administración.
export default async function OrdenCompraPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole(['comprador', 'productor', 'admin'])
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const { order, eventos, error } = await getOrder(id, ['comprador', 'productor', 'admin'])
  if (error) throw new Error('No se pudo cargar la orden.')
  if (!order || order.flujo !== 2 || ['pendiente', 'rechazado'].includes(order.estado)) notFound()
  const volver = profile.rol === 'admin' ? `/admin/pedidos/${id}` : profile.rol === 'productor' ? `/panel-productor/ventas/${id}` : `/panel-comprador/pedidos/${id}`
  const fila = 'flex justify-between gap-6 border-b border-[#f0ebdf] py-2.5 text-sm'
  return <main className="min-h-screen bg-crema px-4 py-8 print:bg-white print:p-0">
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden"><Link href={volver} className="text-sm font-semibold text-petroleo underline underline-offset-4">← Volver al pedido</Link><BotonImprimir /></div>
      <article className="rounded-[22px] bg-white p-7 shadow-[0_30px_60px_-40px_rgba(19,53,53,0.5)] ring-1 ring-[#ebe4d4] sm:p-10 print:rounded-none print:shadow-none print:ring-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#ebe4d4] pb-6">
          <div><p translate="no" className="flex items-center gap-2 text-xl font-light tracking-[0.06em] text-petroleo"><IconoBrote className="size-6 text-musgo" />AGROSIGNAL</p><p className="mt-1 text-xs text-gray-500">agrosignal.vercel.app</p></div>
          <div className="text-right"><h1 className="text-2xl font-normal text-petroleo">Orden de compra</h1><p className="mt-1 text-sm tabular-nums text-gray-600">N.° {order.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-gray-500">Acordada el {fechaHora(order.acordado_en ?? order.actualizado_en)}</p></div>
        </header>
        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Vendedor (productor)</p><p className="mt-2 font-semibold text-gray-900">{order.productor_nombre}</p><p className="text-sm text-gray-600">Tel. {order.productor_telefono || '—'}</p></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Comprador</p><p className="mt-2 font-semibold text-gray-900">{order.comprador_nombre}</p><p className="text-sm text-gray-600">Tel. {order.comprador_telefono || '—'}</p></div>
        </section>
        <div className="overflow-x-auto"><table className="w-full min-w-[28rem] text-sm">
          <thead><tr className="border-y border-[#ebe4d4] text-left text-xs text-gray-500"><th className="py-2.5 font-medium">Producto</th><th className="py-2.5 text-right font-medium">Cantidad</th><th className="py-2.5 text-right font-medium">Precio unitario</th><th className="py-2.5 text-right font-medium">Importe</th></tr></thead>
          <tbody><tr className="border-b border-[#f0ebdf]"><td className="py-3 font-semibold">{order.cultivo}</td><td className="py-3 text-right tabular-nums">{quantity(order.cantidad)} {order.unidad}</td><td className="py-3 text-right tabular-nums">{money(order.precio_unidad)}</td><td className="py-3 text-right tabular-nums">{money(order.total)}</td></tr></tbody>
          <tfoot><tr><td colSpan={3} className="pt-4 text-right font-semibold">Total</td><td className="pt-4 text-right text-xl font-bold tabular-nums text-petroleo">{money(order.total)}</td></tr></tfoot>
        </table></div>
        <section className="mt-8 grid gap-x-10 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-petroleo">Condiciones</h2>
            <p className={fila}><span className="text-gray-500">Entrega</span><span className="text-right">{order.entrega === 'recojo' ? 'Recojo en chacra' : 'Envío'}</span></p>
            <p className={fila}><span className="text-gray-500">Fecha</span><span className="text-right">{order.fecha_entrega ? fecha(order.fecha_entrega) : 'Por coordinar'}</span></p>
            <p className={fila}><span className="text-gray-500">Dirección</span><span className="text-right wrap-anywhere">{order.direccion_entrega}</span></p>
            <p className={fila}><span className="text-gray-500">Forma de pago</span><span className="text-right">{FORMAS_PAGO[order.forma_pago ?? 'antes_envio'][0]}</span></p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-petroleo">Estado</h2>
            <p className={fila}><span className="text-gray-500">Situación</span><EtiquetaPedido order={order} /></p>
            <p className={fila}><span className="text-gray-500">Pago</span><span className="text-right">{order.pago_confirmado_en ? `Confirmado · ${order.pago_metodo ? METODOS_PAGO[order.pago_metodo] : ''}` : order.pago_informado_en ? 'Informado' : 'Pendiente'}</span></p>
            <p className={fila}><span className="text-gray-500">Despacho</span><span className="text-right">{order.enviado_en ? `${fecha(order.enviado_en.slice(0, 10))}${order.guia_remision ? ` · Guía ${order.guia_remision}` : ''}` : 'Pendiente'}</span></p>
            <p className={fila}><span className="text-gray-500">Comprobante</span><span className="text-right">{order.comprobante_en ? `${COMPROBANTES[order.comprobante_tipo!]} ${order.comprobante_numero}` : 'Pendiente'}</span></p>
          </div>
        </section>
        <section className="mt-8"><h2 className="mb-2 text-sm font-semibold text-petroleo">Historial</h2><ol className="text-sm">{eventos.map(e => <li key={e.id} className={fila}><span className="text-gray-700">{{ solicitud: 'Solicitud', propuesta: 'Contrapropuesta', propuesta_rechazada: 'Propuesta rechazada', acuerdo: 'Acuerdo', rechazado: 'Rechazo', cancelado: 'Cancelación', pago_informado: 'Pago informado', pago_confirmado: 'Pago confirmado', enviado: 'Despacho', recibido: 'Recepción', observacion: 'Observación', comprobante: 'Comprobante' }[e.tipo] ?? e.tipo}{e.detalle ? ` · ${e.detalle}` : ''}</span><span className="shrink-0 text-gray-500">{fechaHora(e.creado_en)}</span></li>)}</ol></section>
        <footer className="mt-10 border-t border-[#ebe4d4] pt-5 text-xs leading-relaxed text-gray-500">
          Constancia del acuerdo registrado en AgroSignal entre las partes. No es un comprobante de pago: la factura, boleta o liquidación de compra la emite quien corresponde ante la SUNAT. El pago se realiza directamente entre comprador y productor; AgroSignal no cobra ni retiene dinero.
        </footer>
      </article>
    </div>
  </main>
}
