'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { solicitarCompraAction } from '@/app/transacciones/actions'
import { Field, FormMessage, inputClass } from '@/components/auth/FormFields'
import { buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui/estilos'
import { money, quantity } from '@/lib/marketplace/types'
import { FORMAS_PAGO, type FormaPago } from '@/lib/transacciones/types'

const opcion = 'relative flex cursor-pointer flex-col rounded-2xl p-4 ring-1 ring-linea-fuerte transition hover:ring-petroleo/40 has-checked:bg-crema has-checked:ring-2 has-checked:ring-petroleo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-petroleo'
const PASOS = ['El productor acepta tu solicitud o te propone otras condiciones.', 'Con el acuerdo, ves su teléfono y pagas directo al productor según lo pactado.', 'Él despacha, tú confirmas la recepción y se registra el comprobante.']

// Solicitud de compra de un lote: cantidad, entrega, fecha, forma de pago y mensaje; luego revisión.
export function PurchaseForm({ lotId, crop, unit, price, stock, requestId }: {
  lotId: string; crop: string; unit: 'kg' | 'ton'; price: number; stock: number; requestId: string
}) {
  const [state, action, pending] = useActionState(solicitarCompraAction, {})
  const [step, setStep] = useState(0)
  const [amount, setAmount] = useState('')
  const [entrega, setEntrega] = useState<'envio' | 'recojo'>('envio')
  const [address, setAddress] = useState('')
  const [fecha, setFecha] = useState('')
  const [forma, setForma] = useState<FormaPago>('antes_envio')
  const [mensaje, setMensaje] = useState('')
  const [idempotency] = useState(requestId)
  const router = useRouter()
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())

  if (state.pedidoId) return <div className="space-y-5 rounded-[22px] border border-linea-fuerte bg-white p-6 sm:p-8">
    <h2 className="text-2xl font-normal text-petroleo">Solicitud enviada</h2>
    <p className="text-sm leading-relaxed text-gray-600">El productor recibió un aviso y te responderá en el pedido. No se hizo ningún cobro: el pago se acuerda con él y se hace directamente.</p>
    <div className="flex flex-wrap gap-3"><Link href={`/panel-comprador/pedidos/${state.pedidoId}?creado=1`} className={buttonPrimaryClass}>Ver mi pedido</Link><Link href="/marketplace" className="inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline">Seguir explorando</Link></div>
  </div>

  return <form action={step === 1 ? action : undefined} onSubmit={event => { if (step === 0) { event.preventDefault(); setStep(1) } }} className="space-y-7 rounded-[22px] border border-linea bg-white p-5 sm:p-8">
    <ol className="flex flex-wrap gap-4 text-sm font-semibold" aria-label="Pasos de la solicitud">
      {['Tu solicitud', 'Revisar y enviar'].map((t, i) => <li key={t} aria-current={step === i ? 'step' : undefined} className={step === i ? 'text-petroleo' : 'text-gray-500'}>{i + 1}. {t}</li>)}
    </ol>
    <FormMessage state={state} />
    <input type="hidden" name="lote_id" value={lotId} /><input type="hidden" name="idempotencia" value={idempotency} /><input type="hidden" name="precio_esperado" value={price} />
    <fieldset disabled={pending} className="space-y-6">
      {step === 0 ? <>
        <Field name="cantidad" label={`Cantidad (${unit})`} type="number" min="0.001" max={stock} step="0.001" required value={amount} onChange={e => setAmount(e.target.value)} hint={`${quantity(stock)} ${unit} disponibles · ${money(price)} por ${unit}${amount ? ` · Total estimado ${money(Number(amount) * price)}` : ''}`} />
        <fieldset><legend className="mb-2 text-sm font-semibold">¿Cómo recibes la cosecha?</legend><div className="grid gap-3 sm:grid-cols-2">
          {([['envio', 'Envío a mi dirección', 'El productor despacha y registra la guía de remisión.'], ['recojo', 'Recojo en chacra', 'Tú o tu transportista recogen la cosecha.']] as const).map(([v, t, d]) => <label key={v} className={opcion}><input type="radio" name="entrega" value={v} checked={entrega === v} onChange={() => setEntrega(v)} className="sr-only" /><span className="text-sm font-semibold text-petroleo">{t}</span><span className="mt-1 text-xs text-gray-600">{d}</span></label>)}
        </div></fieldset>
        {entrega === 'envio' && <div className="space-y-2"><label htmlFor="direccion_entrega" className="block text-sm font-semibold">Dirección de entrega</label><textarea id="direccion_entrega" name="direccion_entrega" required minLength={8} maxLength={500} rows={3} autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} placeholder="Calle, número, distrito, provincia y referencia" /></div>}
        <Field name="fecha_entrega" label="Fecha de entrega deseada (opcional)" type="date" min={hoy} value={fecha} onChange={e => setFecha(e.target.value)} />
        <fieldset><legend className="mb-2 text-sm font-semibold">¿Cuándo pagas?</legend><div className="grid gap-3 sm:grid-cols-2">
          {(Object.entries(FORMAS_PAGO) as [FormaPago, [string, string]][]).map(([v, [t, d]]) => <label key={v} className={opcion}><input type="radio" name="forma_pago" value={v} checked={forma === v} onChange={() => setForma(v)} className="sr-only" /><span className="text-sm font-semibold text-petroleo">{t}</span><span className="mt-1 text-xs text-gray-600">{d}</span></label>)}
        </div></fieldset>
        <div className="space-y-2"><label htmlFor="mensaje" className="block text-sm font-semibold">Mensaje al productor (opcional)</label><textarea id="mensaje" name="mensaje" maxLength={1000} rows={3} value={mensaje} onChange={e => setMensaje(e.target.value)} className={inputClass} placeholder="Calibre, empaque, horario de recepción o cualquier detalle." /></div>
      </> : <>
        {['cantidad', 'entrega', 'direccion_entrega', 'fecha_entrega', 'forma_pago', 'mensaje'].map(k => <input key={k} type="hidden" name={k} value={{ cantidad: amount, entrega, direccion_entrega: address, fecha_entrega: fecha, forma_pago: forma, mensaje }[k]} />)}
        <h2 className="text-xl font-normal text-petroleo">Revisa tu solicitud</h2>
        <dl className="grid gap-4 rounded-2xl bg-crema p-5 text-sm sm:grid-cols-2 wrap-anywhere">
          <div><dt className="text-gray-600">Lote</dt><dd className="font-semibold">{crop}</dd></div>
          <div><dt className="text-gray-600">Cantidad y precio</dt><dd className="font-semibold">{quantity(Number(amount))} {unit} × {money(price)}</dd></div>
          <div><dt className="text-gray-600">Entrega</dt><dd className="font-semibold">{entrega === 'recojo' ? 'Recojo en chacra' : address}{fecha ? ` · ${new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${fecha}T12:00:00Z`))}` : ''}</dd></div>
          <div><dt className="text-gray-600">Pago</dt><dd className="font-semibold">{FORMAS_PAGO[forma][0]}</dd></div>
          <div className="border-t border-linea-fuerte pt-4 sm:col-span-2"><dt className="font-semibold">Total estimado</dt><dd className="text-3xl font-semibold tabular-nums text-petroleo">{money(Number(amount) * price)}</dd></div>
        </dl>
        <div><p className="text-sm font-semibold text-petroleo">Qué pasa después</p><ol className="mt-3 space-y-2">{PASOS.map((t, i) => <li key={t} className="flex gap-3 text-sm text-gray-700"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-petroleo text-xs font-semibold text-white">{i + 1}</span>{t}</li>)}</ol></div>
        <p className="text-xs leading-relaxed text-gray-500">Enviar la solicitud no reserva stock ni hace un cobro. AgroSignal no cobra ni retiene dinero: registra cada paso y los documentos, y ayuda si hay un problema.</p>
      </>}
    </fieldset>
    <div className="flex flex-wrap items-center gap-3">
      {step === 1 && <button type="button" disabled={pending} onClick={() => setStep(0)} className={buttonSecondaryClass}>Anterior</button>}
      <button disabled={pending} className={buttonPrimaryClass}>{pending ? 'Enviando…' : step === 0 ? 'Revisar solicitud' : 'Enviar solicitud'}</button>
      {state.error && <button type="button" disabled={pending} onClick={() => router.refresh()} className="min-h-11 text-sm font-semibold text-petroleo underline">Actualizar disponibilidad</button>}
    </div>
  </form>
}
