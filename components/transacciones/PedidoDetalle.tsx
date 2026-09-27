import Link from 'next/link'
import { SeccionCalificacion } from '@/components/calificaciones/SeccionCalificacion'
import { money, quantity } from '@/lib/marketplace/types'
import type { EstadoCalificacion } from '@/lib/calificaciones/types'
import type { DocumentosPedido } from '@/lib/transacciones/data'
import { NOMBRE_FASE, faseActual, fasesDe, siguientePaso } from '@/lib/transacciones/fases'
import { COMPROBANTES, FORMAS_PAGO, METODOS_PAGO, type EventoPedido, type Pedido } from '@/lib/transacciones/types'
import { EtiquetaPedido } from './EtiquetaPedido'
import { PasoPedido } from './PasoPedido'

const tarjeta = 'rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-7'
const fechaHora = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(v))
const fecha = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${v}T12:00:00Z`))
const EVENTOS: Record<string, string> = {
  solicitud: 'Solicitud enviada', propuesta: 'El productor propuso nuevas condiciones', propuesta_rechazada: 'El comprador rechazó la propuesta',
  acuerdo: 'Acuerdo confirmado', rechazado: 'Solicitud rechazada', cancelado: 'Pedido cancelado', pago_informado: 'Pago informado por el comprador',
  pago_confirmado: 'Pago confirmado por el productor', enviado: 'Cosecha despachada', recibido: 'Recepción confirmada', observacion: 'Problema reportado',
  comprobante: 'Comprobante registrado',
}
const AVISOS_PAGO: Record<string, [string, string]> = {
  aprobado: ['bg-musgo/10 text-bosque', 'Mercado Pago aprobó tu pago. El productor ya recibió el aviso para despachar.'],
  pendiente: ['bg-trigo/20 text-cacao', 'Tu pago está en proceso en Mercado Pago. Lo confirmaremos aquí apenas se acredite.'],
  rechazado: ['bg-red-50 text-red-900', 'Mercado Pago no aprobó el pago. Puedes intentarlo de nuevo con otro medio.'],
  cancelado: ['bg-gray-100 text-gray-700', 'No se completó el pago. Puedes intentarlo de nuevo cuando quieras.'],
  invalido: ['bg-red-50 text-red-900', 'No pudimos verificar ese pago. Si se descontó dinero, escríbenos desde Contáctanos.'],
}
function Dato({ t, children }: { t: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-gray-500">{t}</dt><dd className="mt-1 text-sm font-semibold text-gray-900 wrap-anywhere">{children}</dd></div>
}

// Detalle de un pedido del flujo de compra (flujo 2), para comprador y productor.
export function PedidoDetalle({ order, role, eventos, documentos, calificacion, created = false, pagoEnLinea = false, avisoPago }: {
  order: Pedido; role: 'comprador' | 'productor'; eventos: EventoPedido[]; documentos: DocumentosPedido; calificacion: EstadoCalificacion | null; created?: boolean; pagoEnLinea?: boolean; avisoPago?: string
}) {
  const fases = fasesDe(order), actual = faseActual(order), paso = siguientePaso(order, role)
  const indice = actual === 'completado' ? fases.length : actual === 'terminado' ? -1 : fases.indexOf(actual)
  const acordado = !['pendiente', 'rechazado'].includes(order.estado)
  const telefono = role === 'productor' ? order.comprador_telefono : order.productor_telefono
  const recibido = order.estado === 'recibido' || order.estado === 'calificado'
  const volver = role === 'productor' ? '/panel-productor' : '/panel-comprador'

  return <div className="space-y-6">
    <Link href={volver} className="inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline underline-offset-4">← {role === 'productor' ? 'Mis ventas' : 'Mis compras'}</Link>
    {avisoPago && AVISOS_PAGO[avisoPago] && <p role="status" className={`rounded-2xl px-5 py-4 text-sm ${AVISOS_PAGO[avisoPago][0]}`}>{AVISOS_PAGO[avisoPago][1]}</p>}
    {created && <p role="status" className="rounded-2xl bg-musgo/10 px-5 py-4 text-sm text-bosque">Solicitud enviada. El productor recibió un aviso y te responderá aquí.</p>}

    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500">Pedido #{order.id.slice(0, 8)} · {fechaHora(order.creado_en)}</p>
        <h1 className="mt-1 text-3xl font-normal text-petroleo sm:text-4xl wrap-anywhere">{order.cultivo}</h1>
        <p className="mt-1 text-sm text-gray-600">{quantity(order.cantidad)} {order.unidad} · <strong className="text-petroleo">{money(order.total)}</strong></p>
      </div>
      <div className="flex flex-wrap items-center gap-3"><EtiquetaPedido order={order} grande />{acordado && <Link href={`/pedidos/${order.id}/orden`} className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold text-petroleo ring-1 ring-petroleo/25 hover:bg-crema">Orden de compra</Link>}</div>
    </header>

    {/* Fases */}
    <ol aria-label="Fases del pedido" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {fases.map((f, i) => {
        const hecho = i < indice, ahora = i === indice
        return <li key={f} aria-current={ahora ? 'step' : undefined} className="min-w-0">
          <span aria-hidden="true" className={`block h-1.5 rounded-full ${hecho ? 'bg-musgo' : ahora ? 'bg-petroleo' : 'bg-[#ebe4d4]'}`} />
          <span className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${hecho ? 'text-musgo' : ahora ? 'text-petroleo' : 'text-gray-400'}`}>{hecho && <span aria-hidden="true">✓</span>}{NOMBRE_FASE[f]}{hecho && <span className="sr-only"> (completada)</span>}</span>
        </li>
      })}
    </ol>

    {/* Siguiente paso */}
    <section aria-labelledby="siguiente" className={`rounded-[22px] p-6 sm:p-7 ${paso.quien === 'yo' ? 'bg-white ring-2 ring-petroleo shadow-[0_20px_40px_-30px_rgba(19,53,53,0.5)]' : 'border border-[#ebe4d4] bg-crema'}`}>
      <p id="siguiente" className={`text-xs font-semibold uppercase tracking-[0.14em] ${paso.quien === 'yo' ? 'inline-flex rounded-full bg-naranja px-3 py-1 text-petroleo' : 'text-tierra'}`}>{paso.quien === 'yo' ? 'Te toca' : paso.quien === 'otro' ? 'En espera' : actual === 'completado' ? 'Completado' : 'Estado final'}</p>
      <p className="mt-2 text-lg leading-snug text-petroleo">{paso.texto}</p>
      <div className="mt-5"><PasoPedido order={order} role={role} pagoEnLinea={pagoEnLinea} /></div>
    </section>

    {order.propuesta_en && <section className={`${tarjeta} ring-2 ring-trigo`} aria-labelledby="propuesta">
      <h2 id="propuesta" className="text-xl font-normal text-petroleo">Propuesta del productor</h2>
      <div className="mt-4"><table className="w-full table-fixed text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="w-[26%] pb-2 font-medium">Condición</th><th className="pb-2 font-medium">Solicitud</th><th className="pb-2 font-medium">Propuesta</th></tr></thead><tbody className="divide-y divide-[#f0ebdf]">
        {[['Precio', `${money(order.precio_unidad)} / ${order.unidad}`, `${money(Number(order.propuesta_precio))} / ${order.unidad}`],
          ['Cantidad', `${quantity(order.cantidad)} ${order.unidad}`, `${quantity(Number(order.propuesta_cantidad))} ${order.unidad}`],
          ['Total', money(order.total), money(Math.round(Number(order.propuesta_cantidad) * Number(order.propuesta_precio) * 100) / 100)],
          ['Entrega', order.fecha_entrega ? fecha(order.fecha_entrega) : 'Por coordinar', order.propuesta_fecha ? fecha(order.propuesta_fecha) : 'Por coordinar'],
          ['Pago', FORMAS_PAGO[order.forma_pago ?? 'antes_envio'][0], FORMAS_PAGO[order.propuesta_forma_pago ?? 'antes_envio'][0]],
        ].map(([c, a, b]) => <tr key={c}><td className="py-2.5 pr-2 align-top text-gray-600">{c}</td><td className="py-2.5 pr-2 align-top">{a}</td><td className={`py-2.5 align-top font-semibold ${a !== b ? 'text-petroleo' : ''}`}>{b}</td></tr>)}
      </tbody></table></div>
      {order.propuesta_nota && <p className="mt-4 rounded-xl bg-crema px-4 py-3 text-sm text-cacao">“{order.propuesta_nota}”</p>}
    </section>}

    <div className="grid gap-6 lg:grid-cols-2">
      <section className={tarjeta} aria-labelledby="acuerdo">
        <h2 id="acuerdo" className="text-xl font-normal text-petroleo">{acordado ? 'Condiciones acordadas' : 'Condiciones solicitadas'}</h2>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4">
          <Dato t="Cantidad">{quantity(order.cantidad)} {order.unidad}</Dato>
          <Dato t="Precio">{money(order.precio_unidad)} / {order.unidad}</Dato>
          <Dato t="Forma de pago">{FORMAS_PAGO[order.forma_pago ?? 'antes_envio'][0]}</Dato>
          <Dato t="Entrega">{order.entrega === 'recojo' ? 'Recojo en chacra' : 'Envío'}{order.fecha_entrega ? ` · ${fecha(order.fecha_entrega)}` : ''}</Dato>
          <div className="col-span-2"><Dato t="Dirección">{order.direccion_entrega}</Dato></div>
          <div className="col-span-2 border-t border-[#f0ebdf] pt-4"><dt className="text-xs text-gray-500">Total</dt><dd className="mt-1 text-3xl font-bold tabular-nums text-petroleo">{money(order.total)}</dd></div>
        </dl>
        {order.mensaje && <p className="mt-5 rounded-xl bg-crema px-4 py-3 text-sm text-cacao"><span className="block text-xs font-semibold text-tierra">Mensaje del comprador</span>{order.mensaje}</p>}
      </section>

      <div className="space-y-6">
        <section className={tarjeta} aria-labelledby="partes">
          <h2 id="partes" className="text-xl font-normal text-petroleo">Partes</h2>
          <dl className="mt-5 space-y-4">
            <Dato t="Productor"><Link href={`/marketplace/productor/${order.productor_id}`} className="underline-offset-4 hover:underline">{order.productor_nombre}</Link></Dato>
            <Dato t="Comprador">{role === 'productor' ? <Link href={`/compradores/${order.comprador_id}`} className="underline-offset-4 hover:underline">{order.comprador_nombre}</Link> : order.comprador_nombre}</Dato>
            <Dato t={`Teléfono ${role === 'productor' ? 'del comprador' : 'del productor'}`}>{acordado ? telefono || <span className="font-normal text-gray-500">No registró un teléfono</span> : <span className="font-normal text-gray-500">Se muestra al confirmar el acuerdo</span>}</Dato>
          </dl>
        </section>
        <section className={tarjeta} aria-labelledby="documentos">
          <h2 id="documentos" className="text-xl font-normal text-petroleo">Pago y documentos</h2>
          <dl className="mt-5 space-y-4">
            <Dato t="Pago">{order.pago_confirmado_en ? `Confirmado el ${fechaHora(order.pago_confirmado_en)}` : order.pago_informado_en ? `Informado el ${fechaHora(order.pago_informado_en)}` : 'Pendiente'}{order.pago_metodo ? ` · ${METODOS_PAGO[order.pago_metodo]}` : ''}{order.pago_operacion ? ` · Op. ${order.pago_operacion}` : ''}</Dato>
            {documentos.voucher && <Dato t="Constancia de pago"><a href={documentos.voucher} target="_blank" rel="noopener noreferrer" className="text-petroleo underline underline-offset-4">Ver constancia <span className="sr-only">(se abre en otra pestaña)</span></a></Dato>}
            {(order.guia_remision || order.transportista) && <Dato t="Despacho">{[order.guia_remision && `Guía ${order.guia_remision}`, order.transportista].filter(Boolean).join(' · ')}</Dato>}
            <Dato t="Comprobante">{order.comprobante_en ? <>{COMPROBANTES[order.comprobante_tipo!]} {order.comprobante_numero}{documentos.comprobante && <> · <a href={documentos.comprobante} target="_blank" rel="noopener noreferrer" className="text-petroleo underline underline-offset-4">Ver archivo</a></>}</> : <span className="font-normal text-gray-500">Pendiente</span>}</Dato>
          </dl>
          {!order.comprobante_en && <p className="mt-5 text-xs leading-relaxed text-gray-500">Si el productor tiene RUC, emite <strong>factura</strong> (comprador con RUC) o <strong>boleta</strong>. Si no tiene RUC, el comprador emite una <strong>liquidación de compra</strong>. Los productos agrícolas frescos suelen estar exonerados de IGV; confírmalo con tu contador.</p>}
        </section>
      </div>
    </div>

    {order.observacion && <section className={`${tarjeta} border-amber-200 bg-amber-50/60`}><h2 className="text-lg font-semibold text-cacao">Problema reportado</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-cacao wrap-anywhere">{order.observacion}</p><p className="mt-2 text-xs text-gray-600">La administración de AgroSignal lo revisa con ambas partes.</p></section>}
    {order.motivo && <section className={tarjeta}><h2 className="text-lg font-semibold">Motivo de {order.estado === 'rechazado' ? 'rechazo' : 'cancelación'}</h2><p className="mt-2 whitespace-pre-wrap text-sm wrap-anywhere">{order.motivo}</p></section>}
    {order.resolucion && <section className={tarjeta}><h2 className="text-lg font-semibold">Resolución de la administración</h2><p className="mt-2 whitespace-pre-wrap text-sm wrap-anywhere">{order.resolucion}</p></section>}
    {recibido && <SeccionCalificacion pedidoId={order.id} estado={calificacion} contraparte={role === 'productor' ? order.comprador_nombre : order.productor_nombre} yo={role === 'productor' ? order.productor_nombre : order.comprador_nombre} />}

    <section className={tarjeta} aria-labelledby="historial">
      <h2 id="historial" className="text-xl font-normal text-petroleo">Historial</h2>
      <ol className="mt-5 space-y-0">{eventos.map((e, i) => <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
        {i < eventos.length - 1 && <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-px bg-[#ebe4d4]" />}
        <span aria-hidden="true" className={`relative mt-1.5 size-[11px] shrink-0 rounded-full ${['rechazado', 'cancelado', 'observacion'].includes(e.tipo) ? 'bg-tierra' : 'bg-musgo'}`} />
        <div className="min-w-0"><p className="text-sm font-semibold text-gray-900">{EVENTOS[e.tipo] ?? e.tipo}</p>{e.detalle && <p className="mt-0.5 text-sm text-gray-600 wrap-anywhere">{e.detalle}</p>}<p className="mt-0.5 text-xs text-gray-500">{fechaHora(e.creado_en)}</p></div>
      </li>)}</ol>
    </section>

    <p className="text-xs leading-relaxed text-gray-500">El pago se hace directamente entre comprador y productor: AgroSignal no cobra ni retiene dinero. Registra cada paso con fecha y hora, guarda los documentos y, si hay un problema, la administración lo revisa con ambas partes.</p>
  </div>
}
