'use client'

import { useActionState, useState } from 'react'
import { cambiarEstadoPedidoAction, pasoPedidoAction } from '@/app/transacciones/actions'
import { FormMessage, buttonClass, inputClass } from '@/components/auth/FormFields'
import { createClient } from '@/lib/supabase/client'
import { money } from '@/lib/marketplace/types'
import { faseActual } from '@/lib/transacciones/fases'
import { FORMAS_PAGO, METODOS_PAGO, type Pedido } from '@/lib/transacciones/types'

const secundario = 'inline-flex min-h-11 items-center justify-center rounded-full border border-petroleo/25 px-5 text-sm font-semibold text-petroleo transition hover:bg-crema'
const peligro = 'inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-red-700 hover:bg-red-50'
const etiqueta = 'mb-1.5 block text-sm font-semibold text-petroleo'
const hoy = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())

// Acciones del paso en curso, según la fase del pedido y el rol de quien lo mira.
export function PasoPedido({ order, role }: { order: Pedido; role: 'comprador' | 'productor' }) {
  const [paso, pasoAction, pasoPending] = useActionState(pasoPedidoAction, {})
  const [estado, estadoAction, estadoPending] = useActionState(cambiarEstadoPedidoAction, {})
  const [abierto, setAbierto] = useState<string | null>(null)
  const f = faseActual(order)
  const pending = pasoPending || estadoPending
  const oculto = <input type="hidden" name="pedido_id" value={order.id} />
  const mensajes = <><FormMessage state={paso} /><FormMessage state={estado} /></>

  // Botón que cambia de estado con confirmación (y motivo para rechazar o cancelar).
  const cambioEstado = (key: string, a: 'confirmado' | 'rechazado' | 'enviado' | 'recibido' | 'cancelado', texto: string, detalle: string, clase = buttonClass) => abierto === a
    ? <form key={key} action={estadoAction} className="w-full space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[#ebe4d4]">
      {oculto}<input type="hidden" name="estado" value={a} />
      <p className="text-sm leading-relaxed text-gray-700">{detalle}</p>
      {(a === 'rechazado' || a === 'cancelado') && <div><label htmlFor={`motivo-${a}`} className={etiqueta}>Motivo</label><textarea id={`motivo-${a}`} name="motivo" required minLength={5} maxLength={500} rows={3} className={inputClass} /></div>}
      <div className="flex flex-wrap gap-3"><button disabled={pending} className={a === 'rechazado' || a === 'cancelado' ? 'inline-flex min-h-11 items-center rounded-full bg-red-700 px-5 text-sm font-semibold text-white' : buttonClass}>{pending ? 'Guardando…' : `Sí, ${texto.toLowerCase()}`}</button><button type="button" onClick={() => setAbierto(null)} className={secundario}>Volver</button></div>
    </form>
    : <button key={key} type="button" onClick={() => setAbierto(a)} className={clase}>{texto}</button>

  const accionBoton = (key: string, accion: string, texto: string, extra: Record<string, string> = {}, clase = buttonClass) => <form key={key} action={pasoAction}>
    {oculto}<input type="hidden" name="accion" value={accion} />{Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
    <button disabled={pending} className={clase}>{pending ? 'Guardando…' : texto}</button>
  </form>

  const botones: React.ReactNode[] = []
  let formulario: React.ReactNode = null

  if (role === 'productor') {
    if (f === 'solicitud') {
      botones.push(cambioEstado('a', 'confirmado', 'Aceptar solicitud', `Se confirmará el acuerdo por ${money(order.total)} y se descontará la cantidad de tu stock.`),
        <button key="p" type="button" onClick={() => setAbierto('proponer')} className={secundario}>Proponer otras condiciones</button>,
        cambioEstado('r', 'rechazado', 'Rechazar', 'El comprador recibirá el motivo. La solicitud no podrá aceptarse después.', peligro))
      if (abierto === 'proponer') formulario = <form action={pasoAction} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[#ebe4d4]">
        {oculto}<input type="hidden" name="accion" value="proponer" />
        <p className="text-sm text-gray-700">Ajusta lo que necesites. El comprador podrá aceptar o rechazar tu propuesta.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="precio" className={etiqueta}>Precio por {order.unidad} (S/)</label><input id="precio" name="precio" type="number" step="0.01" min="0.01" required defaultValue={order.precio_unidad} className={inputClass} /></div>
          <div><label htmlFor="cantidad" className={etiqueta}>Cantidad ({order.unidad})</label><input id="cantidad" name="cantidad" type="number" step="0.001" min="0.001" required defaultValue={order.cantidad} className={inputClass} /></div>
          <div><label htmlFor="fecha" className={etiqueta}>Fecha de entrega</label><input id="fecha" name="fecha_entrega" type="date" min={hoy()} defaultValue={order.fecha_entrega ?? ''} className={inputClass} /></div>
          <div><label htmlFor="forma" className={etiqueta}>Forma de pago</label><select id="forma" name="forma_pago" defaultValue={order.forma_pago} className={inputClass}>{Object.entries(FORMAS_PAGO).map(([v, [t]]) => <option key={v} value={v}>{t}</option>)}</select></div>
        </div>
        <div><label htmlFor="nota" className={etiqueta}>Nota para el comprador</label><textarea id="nota" name="nota" maxLength={500} rows={2} className={inputClass} placeholder="Por ejemplo: tengo 400 kg de ese calibre; el resto sale en 2 semanas." /></div>
        <div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Enviando…' : 'Enviar propuesta'}</button><button type="button" onClick={() => setAbierto(null)} className={secundario}>Volver</button></div>
      </form>
    } else if (f === 'acuerdo') {
      botones.push(cambioEstado('r', 'rechazado', 'Retirar y rechazar la solicitud', 'El comprador recibirá el motivo.', peligro))
    } else if (f === 'pago') {
      botones.push(accionBoton('c', 'confirmar_pago', order.pago_informado_en ? 'Confirmar pago recibido' : 'Ya recibí el pago'))
      if (order.estado === 'confirmado') botones.push(cambioEstado('x', 'cancelado', 'Cancelar pedido', 'La cantidad volverá a tu stock.', peligro))
    } else if (f === 'despacho') {
      botones.push(<button key="d" type="button" onClick={() => setAbierto('despachar')} className={buttonClass}>{order.entrega === 'recojo' ? 'Marcar como entregado' : 'Registrar despacho'}</button>,
        cambioEstado('x', 'cancelado', 'Cancelar pedido', 'La cantidad volverá a tu stock. Si ya recibiste un pago, devuélvelo al comprador.', peligro))
      if (abierto === 'despachar') formulario = <form action={pasoAction} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[#ebe4d4]">
        {oculto}<input type="hidden" name="accion" value="despachar" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="guia" className={etiqueta}>Guía de remisión</label><input id="guia" name="guia" maxLength={40} placeholder="T001-00012345 (si la emites)" className={inputClass} /></div>
          <div><label htmlFor="transportista" className={etiqueta}>Transportista</label><input id="transportista" name="transportista" maxLength={120} placeholder={order.entrega === 'recojo' ? 'Lo recoge el comprador' : 'Empresa y placa del vehículo'} className={inputClass} /></div>
        </div>
        <div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Guardando…' : 'Confirmar despacho'}</button><button type="button" onClick={() => setAbierto(null)} className={secundario}>Volver</button></div>
      </form>
    } else if (f === 'cierre' && !order.comprobante_en) {
      botones.push(<button key="c" type="button" onClick={() => setAbierto('comprobante')} className={buttonClass}>Registrar factura o boleta</button>)
      if (abierto === 'comprobante') formulario = <FormComprobante order={order} tipos={['factura', 'boleta']} action={pasoAction} pending={pending} onVolver={() => setAbierto(null)} />
    }
  } else {
    if (f === 'solicitud') botones.push(cambioEstado('x', 'cancelado', 'Cancelar solicitud', 'El productor recibirá el motivo.', peligro))
    else if (f === 'acuerdo') botones.push(accionBoton('a', 'responder', 'Aceptar propuesta', { aceptar: '1' }), accionBoton('r', 'responder', 'Rechazar propuesta', { aceptar: '0' }, secundario))
    else if (f === 'pago' && !order.pago_informado_en) formulario = <FormPago order={order} action={pasoAction} pending={pending} />
    else if (f === 'despacho') botones.push(cambioEstado('x', 'cancelado', 'Cancelar pedido', 'El productor recibirá el motivo. Si ya pagaste, coordina la devolución con él.', peligro))
    else if (f === 'recepcion') {
      botones.push(cambioEstado('r', 'recibido', 'Confirmar recepción conforme', 'Confirma que recibiste la cosecha en la cantidad y calidad acordadas.'),
        <button key="o" type="button" onClick={() => setAbierto('observacion')} className={secundario}>Reportar un problema</button>)
    } else if (f === 'cierre' && !order.comprobante_en) {
      botones.push(<button key="l" type="button" onClick={() => setAbierto('comprobante')} className={secundario}>Registrar liquidación de compra</button>)
      if (abierto === 'comprobante') formulario = <FormComprobante order={order} tipos={['liquidacion_compra']} action={pasoAction} pending={pending} onVolver={() => setAbierto(null)} />
    }
    if (abierto === 'observacion') formulario = <form action={pasoAction} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[#ebe4d4]">
      {oculto}<input type="hidden" name="accion" value="observacion" />
      <div><label htmlFor="detalle" className={etiqueta}>¿Qué pasó?</label><textarea id="detalle" name="detalle" required minLength={10} maxLength={1000} rows={3} className={inputClass} placeholder="Cantidad, calidad o estado de la cosecha. Adjunta fotos si luego te las pide la administración." /></div>
      <div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Enviando…' : 'Enviar reporte'}</button><button type="button" onClick={() => setAbierto(null)} className={secundario}>Volver</button></div>
    </form>
  }

  if (!botones.length && !formulario) return mensajes
  return <div className="space-y-4">
    {mensajes}
    {formulario}
    {!formulario && <div className="flex flex-wrap items-center gap-3">{botones}</div>}
  </div>
}

// Sube un archivo a documentos-pedido/<pedido>/<uuid>.<ext> y devuelve su ruta.
function SubirDocumento({ pedidoId, name, label, requerido }: { pedidoId: string; name: string; label: string; requerido: boolean }) {
  const [ruta, setRuta] = useState(''), [estado, setEstado] = useState<'libre' | 'subiendo' | 'listo' | 'error'>('libre'), [nombre, setNombre] = useState('')
  async function subir(file?: File) {
    if (!file) return
    const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    if (!ext || file.size > 10 * 1024 * 1024) { setEstado('error'); setNombre('Usa un PDF o una imagen de hasta 10 MB.'); return }
    setEstado('subiendo'); setNombre(file.name)
    const destino = `${pedidoId}/${crypto.randomUUID()}.${ext}`
    const { error } = await createClient().storage.from('documentos-pedido').upload(destino, file, { contentType: file.type, upsert: false })
    if (error) { setEstado('error'); setNombre('No pudimos subir el archivo. Intenta de nuevo.'); return }
    setRuta(destino); setEstado('listo')
  }
  return <div>
    <label htmlFor={`archivo-${name}`} className={etiqueta}>{label}{requerido ? '' : ' (opcional)'}</label>
    <input id={`archivo-${name}`} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={e => subir(e.target.files?.[0])} className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-crema file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-petroleo" />
    <input type="hidden" name={name} value={ruta} required={requerido} />
    {estado !== 'libre' && <p className={`mt-2 text-xs ${estado === 'error' ? 'text-red-800' : 'text-gray-600'}`}>{estado === 'subiendo' ? `Subiendo ${nombre}…` : estado === 'listo' ? `✓ ${nombre} listo` : nombre}</p>}
  </div>
}

function FormPago({ order, action, pending }: { order: Pedido; action: (f: FormData) => void; pending: boolean }) {
  const [metodo, setMetodo] = useState('transferencia')
  return <form action={action} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[#ebe4d4]">
    <input type="hidden" name="pedido_id" value={order.id} /><input type="hidden" name="accion" value="informar_pago" />
    <p className="text-sm leading-relaxed text-gray-700">Paga <strong className="text-petroleo">{money(order.total)}</strong> directamente al productor con los datos que te comparta por teléfono. Luego informa aquí el pago.</p>
    <fieldset><legend className={etiqueta}>Método</legend><div className="flex flex-wrap gap-2">{Object.entries(METODOS_PAGO).map(([v, t]) => <label key={v} className="cursor-pointer rounded-full px-4 py-2 text-sm ring-1 ring-[#e2dbc9] has-checked:bg-petroleo has-checked:font-semibold has-checked:text-white has-checked:ring-petroleo"><input type="radio" name="metodo" value={v} checked={metodo === v} onChange={() => setMetodo(v)} className="sr-only" />{t}</label>)}</div></fieldset>
    {metodo !== 'efectivo' && <div><label htmlFor="operacion" className={etiqueta}>N.° de operación</label><input id="operacion" name="operacion" maxLength={60} className={inputClass} /></div>}
    <SubirDocumento pedidoId={order.id} name="voucher" label="Constancia del pago" requerido={metodo !== 'efectivo'} />
    <button disabled={pending} className={buttonClass}>{pending ? 'Enviando…' : 'Informar pago'}</button>
  </form>
}

function FormComprobante({ order, tipos, action, pending, onVolver }: { order: Pedido; tipos: ('factura' | 'boleta' | 'liquidacion_compra')[]; action: (f: FormData) => void; pending: boolean; onVolver: () => void }) {
  const nombres = { factura: 'Factura', boleta: 'Boleta', liquidacion_compra: 'Liquidación de compra' }
  return <form action={action} className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-[#ebe4d4]">
    <input type="hidden" name="pedido_id" value={order.id} /><input type="hidden" name="accion" value="comprobante" />
    <div className="grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="tipo" className={etiqueta}>Tipo</label><select id="tipo" name="tipo" className={inputClass}>{tipos.map(t => <option key={t} value={t}>{nombres[t]}</option>)}</select></div>
      <div><label htmlFor="numero" className={etiqueta}>Serie y número</label><input id="numero" name="numero" required pattern="[A-Za-z0-9]{1,4}-[0-9]{1,8}" placeholder={tipos[0] === 'liquidacion_compra' ? 'E001-12' : 'F001-245'} className={inputClass} /></div>
    </div>
    <SubirDocumento pedidoId={order.id} name="archivo" label="Archivo del comprobante" requerido />
    <div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Guardando…' : 'Registrar comprobante'}</button><button type="button" onClick={onVolver} className={secundario}>Volver</button></div>
  </form>
}
