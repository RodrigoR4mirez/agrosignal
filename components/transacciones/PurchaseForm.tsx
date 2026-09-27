'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearPedidoAction } from '@/app/transacciones/actions'
import { Field, FormMessage, buttonClass, inputClass } from '@/components/auth/FormFields'
import { money, quantity } from '@/lib/marketplace/types'

export function PurchaseForm({ lotId, crop, unit, price, stock, requestId }: {
  lotId: string; crop: string; unit: 'kg' | 'ton'; price: number; stock: number; requestId: string
}) {
  const [state, action, pending] = useActionState(crearPedidoAction, {})
  const [step, setStep] = useState(0)
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  const [idempotency] = useState(requestId)
  const router = useRouter()
  if (state.pedidoId) return <div className="card-surface space-y-5 border border-[#e2dbc9] bg-white p-6">
    <h2 className="text-2xl font-normal text-petroleo">Pedido enviado al productor</h2>
    <p className="text-sm leading-relaxed text-gray-600">Tu pedido está pendiente de aceptación. Puedes seguir su estado en Mis compras. Todavía no se ha realizado ningún cobro.</p>
    <Link href={`/panel-comprador/pedidos/${state.pedidoId}?creado=1`} className={buttonClass}>Ver mi pedido</Link>
    <Link href="/marketplace" className="block text-sm font-semibold text-petroleo underline">Seguir explorando</Link>
  </div>
  return <form action={step === 1 ? action : undefined} onSubmit={event => {
    if (step === 0) { event.preventDefault(); setStep(1) }
  }} className="card-surface space-y-6 border border-gray-100 bg-white p-5 sm:p-8">
    <ol className="flex flex-wrap gap-3 text-sm font-semibold" aria-label="Pasos de compra">
      <li aria-current={step === 0 ? 'step' : undefined} className={step === 0 ? 'text-petroleo' : 'text-gray-500'}>1. Cantidad y entrega</li>
      <li aria-current={step === 1 ? 'step' : undefined} className={step === 1 ? 'text-petroleo' : 'text-gray-500'}>2. Revisar pedido</li>
    </ol>
    <FormMessage state={state} />
    <input type="hidden" name="lote_id" value={lotId} />
    <input type="hidden" name="idempotencia" value={idempotency} />
    <input type="hidden" name="precio_esperado" value={price} />
    <fieldset disabled={pending} className="space-y-5">
      {step === 0 ? <>
        <Field name="cantidad" label={`Cantidad a comprar (${unit})`} type="number" min="0.001" max={stock} step="0.001" required value={amount} onChange={event => setAmount(event.target.value)} hint={`${quantity(stock)} ${unit} disponibles. ${money(price)} por ${unit}.`} />
        <div className="space-y-2"><label htmlFor="direccion_entrega" className="block text-sm font-semibold">Dirección de entrega</label><textarea id="direccion_entrega" name="direccion_entrega" required minLength={8} maxLength={500} rows={4} autoComplete="street-address" value={address} onChange={event => setAddress(event.target.value)} className={inputClass} placeholder="Calle, número, distrito, provincia y referencia" /><p className="text-xs text-gray-600">Solo el productor y la administración pueden consultar esta información para atender tu pedido.</p></div>
      </> : <>
        <input type="hidden" name="cantidad" value={amount} /><input type="hidden" name="direccion_entrega" value={address} />
        <h2 className="text-xl font-semibold">Revisa antes de enviar</h2>
        <dl className="space-y-4 rounded-xl bg-crema p-4 text-sm wrap-anywhere"><div><dt className="text-gray-600">Lote</dt><dd className="font-bold">{crop}</dd></div><div><dt className="text-gray-600">Cantidad y precio</dt><dd>{quantity(Number(amount))} {unit} × {money(price)} / {unit}</dd></div><div><dt className="text-gray-600">Dirección</dt><dd className="whitespace-pre-wrap">{address}</dd></div><div className="border-t border-[#e2dbc9] pt-4"><dt className="font-semibold">Total del pedido</dt><dd className="text-2xl font-extrabold text-petroleo">{money(Number(amount) * price)}</dd></div></dl>
        <p className="text-sm leading-relaxed text-gray-600">El productor revisará la disponibilidad antes de aceptar. El envío del pedido no reserva stock ni realiza un cobro. Coordina el pago y el transporte con el productor cuando acepte.</p>
      </>}
    </fieldset>
    <div className="flex flex-wrap items-center gap-4">
      {step === 1 && <button type="button" disabled={pending} onClick={() => setStep(0)} className="min-h-11 rounded-full border border-gray-300 px-5 text-sm font-semibold">Anterior</button>}
      <button disabled={pending} className={buttonClass}>{pending ? 'Enviando pedido…' : step === 0 ? 'Revisar pedido' : 'Enviar pedido'}</button>
      {state.error && <button type="button" disabled={pending} onClick={() => router.refresh()} className="min-h-11 text-sm font-semibold text-petroleo underline">Actualizar disponibilidad</button>}
    </div>
  </form>
}
