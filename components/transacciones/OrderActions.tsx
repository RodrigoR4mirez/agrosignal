'use client'

import { useActionState, useState } from 'react'
import { cambiarEstadoPedidoAction } from '@/app/transacciones/actions'
import { FormMessage, buttonClass, inputClass } from '@/components/auth/FormFields'
import type { EstadoPedido, Pedido } from '@/lib/transacciones/types'

const labels: Partial<Record<EstadoPedido, string>> = { confirmado: 'Aceptar pedido', rechazado: 'Rechazar pedido', enviado: 'Marcar como enviado', recibido: 'Confirmar recepción', calificado: 'Enviar calificación', cancelado: 'Cancelar pedido' }
const descriptions: Partial<Record<EstadoPedido, string>> = {
  confirmado: 'Al aceptar se descontará esta cantidad del stock disponible.',
  rechazado: 'El comprador recibirá el motivo. Este pedido ya no podrá aceptarse.',
  enviado: 'Confirma que la cosecha ya salió hacia la dirección de entrega.',
  recibido: 'Confirma que recibiste el pedido. Después podrás calificar tu experiencia.',
  cancelado: 'El pedido quedará cancelado. Si ya estaba confirmado, se devolverá su cantidad al stock.',
}
export function OrderActions({ order, role }: { order: Pedido; role: 'productor' | 'comprador' }) {
  const [state, action, pending] = useActionState(cambiarEstadoPedidoAction, {})
  const [selected, setSelected] = useState<EstadoPedido | null>(null)
  const [reason, setReason] = useState('')
  const [rating, setRating] = useState('')
  const [comment, setComment] = useState('')
  const options: EstadoPedido[] = role === 'productor'
    ? order.estado === 'pendiente' ? ['confirmado', 'rechazado'] : order.estado === 'confirmado' ? ['enviado', 'cancelado'] : []
    : order.estado === 'pendiente' || order.estado === 'confirmado' ? ['cancelado'] : order.estado === 'enviado' ? ['recibido'] : order.estado === 'recibido' ? ['calificado'] : []
  const active = selected && options.includes(selected) ? selected : null
  return <div className="space-y-4">
    <FormMessage state={state} />
    {active ? <form action={action} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <input type="hidden" name="pedido_id" value={order.id} /><input type="hidden" name="estado" value={active} />
      <h3 className="text-lg font-bold">{labels[active]}</h3>
      {descriptions[active] && <p className="text-sm leading-relaxed text-gray-600">{descriptions[active]}</p>}
      <fieldset disabled={pending} className="space-y-5">
        {(active === 'rechazado' || active === 'cancelado') && <div className="space-y-2"><label htmlFor="motivo" className="block text-sm font-semibold">Motivo</label><textarea id="motivo" name="motivo" required minLength={5} maxLength={500} rows={3} value={reason} onChange={event => setReason(event.target.value)} className={inputClass} /></div>}
        {active === 'calificado' && <>
          <fieldset><legend className="mb-3 text-sm font-semibold">¿Cómo fue tu experiencia?</legend><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(value => <label key={value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 ${rating === String(value) ? 'border-[#d4a017] bg-amber-50' : 'border-gray-300'}`}><input type="radio" name="calificacion" value={value} required checked={rating === String(value)} onChange={event => setRating(event.target.value)} /><span aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}>{value} <span aria-hidden="true" className="text-[#b8860f]">★</span></span></label>)}</div></fieldset>
          <div className="space-y-2"><label htmlFor="comentario" className="block text-sm font-semibold">Comentario (opcional)</label><textarea id="comentario" name="comentario" maxLength={1000} rows={3} value={comment} onChange={event => setComment(event.target.value)} className={inputClass} /></div>
        </>}
      </fieldset>
      <div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Guardando…' : active === 'calificado' ? 'Enviar calificación' : `Sí, ${labels[active]?.toLowerCase()}`}</button><button type="button" disabled={pending} onClick={() => setSelected(null)} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold">Volver</button></div>
    </form> : <div className="flex flex-wrap gap-3">{options.map(next => <button key={next} onClick={() => setSelected(next)} type="button" className={next === 'rechazado' || next === 'cancelado' ? 'min-h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700' : buttonClass}>{labels[next]}</button>)}</div>}
  </div>
}
