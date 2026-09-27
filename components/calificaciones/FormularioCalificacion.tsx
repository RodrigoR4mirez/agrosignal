'use client'

import { useActionState, useState } from 'react'
import { calificarPedidoAction } from '@/app/transacciones/actions'
import { FormMessage, buttonClass, inputClass } from '@/components/auth/FormFields'
import { ETIQUETAS_ESTRELLAS, PREGUNTAS, fechaCorta, type RolCalificador } from '@/lib/calificaciones/types'
import { Estrellas, IconoCandado, RUTA_ESTRELLA } from './Reputacion'

export function FormularioCalificacion({ pedidoId, rol, contraparte, cierre, otraEnviada }: {
  pedidoId: string; rol: RolCalificador; contraparte: string; cierre: string | null; otraEnviada: boolean
}) {
  const [state, action, pending] = useActionState(calificarPedidoAction, {})
  const [valor, setValor] = useState(0)
  const [previa, setPrevia] = useState(0)
  const [comentario, setComentario] = useState('')
  const [revisando, setRevisando] = useState(false)
  const copy = PREGUNTAS[rol]
  const mostrado = previa || valor

  return <form action={action} className="space-y-6">
    <input type="hidden" name="pedido_id" value={pedidoId} />
    <input type="hidden" name="estrellas" value={valor || ''} />
    <input type="hidden" name="comentario" value={comentario} />
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <h2 className="text-2xl font-medium text-bosque">{copy.titulo}</h2>
      {cierre && <p className="text-sm text-tierra">Puedes calificar hasta el {fechaCorta(cierre)}</p>}
    </div>
    <FormMessage state={state} />

    {!revisando ? <>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="mb-3 text-sm text-gray-600">Para decidir, piensa en esto:</p>
          <ul className="space-y-2">
            {copy.preguntas.map(pregunta => <li key={pregunta} className="flex gap-2.5 text-sm text-gray-800">
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-musgo" />{pregunta}
            </li>)}
          </ul>
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-gray-800">Tu calificación al {copy.contraparte}</legend>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2" onPointerLeave={() => setPrevia(0)}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => <label key={n} className="estrella-opcion cursor-pointer p-1" style={{ ['--i' as string]: n - 1 }}
                data-encendida={n <= mostrado} data-elegida={n === valor} onPointerEnter={() => setPrevia(n)}>
                <input type="radio" name="estrellas-selector" value={n} checked={valor === n} onChange={() => setValor(n)} className="sr-only" aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${ETIQUETAS_ESTRELLAS[n]}`} />
                <svg viewBox="0 0 24 24" width={40} height={40} strokeWidth={1.4} aria-hidden="true"><path d={RUTA_ESTRELLA} /></svg>
              </label>)}
            </div>
            <p aria-live="polite" className="min-w-24 font-display text-lg text-cacao">{mostrado ? ETIQUETAS_ESTRELLAS[mostrado] : <span className="font-sans text-sm text-gray-500">Elige de 1 a 5</span>}</p>
          </div>
        </fieldset>
      </div>
      <div className="space-y-2">
        <label htmlFor={`comentario-${pedidoId}`} className="block text-sm font-semibold text-gray-800">Comentario <span className="font-normal text-gray-500">(opcional)</span></label>
        <textarea id={`comentario-${pedidoId}`} maxLength={1000} rows={4} value={comentario} onChange={event => setComentario(event.target.value)} placeholder={copy.ayuda} className={inputClass} />
        <p className="text-right text-xs tabular-nums text-gray-500">{comentario.length}/1000</p>
      </div>
      {otraEnviada && <p className="flex items-start gap-3 rounded-2xl bg-arena-claro p-4 text-sm leading-relaxed text-cacao">
        <IconoCandado className="mt-0.5 size-5 shrink-0" />{contraparte} ya te calificó. Verás su opinión apenas envíes la tuya.
      </p>}
      <button type="button" disabled={!valor} onClick={() => setRevisando(true)} className={`${buttonClass} disabled:cursor-not-allowed`}>Revisar calificación</button>
    </> : <div className="space-y-5 rounded-2xl border border-[#e4d7bd] bg-arena-claro/60 p-5">
      <p className="text-sm font-semibold text-cacao">Revisa antes de enviar: después no se puede cambiar.</p>
      <div className="flex flex-wrap items-center gap-3"><Estrellas valor={valor} tamano={22} /><span className="font-display text-lg text-cacao">{ETIQUETAS_ESTRELLAS[valor]}</span></div>
      {comentario.trim() ? <blockquote className="max-w-prose whitespace-pre-wrap border-l-2 border-musgo pl-4 text-sm leading-relaxed text-gray-800 wrap-anywhere">{comentario.trim()}</blockquote> : <p className="text-sm text-gray-600">Sin comentario.</p>}
      <p className="text-sm leading-relaxed text-gray-600">{contraparte} no verá tu calificación hasta que también califique, o hasta que venza el plazo.</p>
      <div className="flex flex-wrap gap-3">
        <button disabled={pending} className={buttonClass}>{pending ? 'Enviando…' : 'Enviar calificación'}</button>
        <button type="button" disabled={pending} onClick={() => setRevisando(false)} className="min-h-11 rounded-full border border-gray-300 bg-white px-5 text-sm font-semibold">Seguir editando</button>
      </div>
    </div>}
  </form>
}
