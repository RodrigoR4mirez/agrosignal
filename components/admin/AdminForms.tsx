'use client'

import { useActionState, useState } from 'react'
import { moderarUsuarioAction, resolverDisputaAction } from '@/app/admin/actions'
import { FormMessage, inputClass, buttonClass } from '@/components/auth/FormFields'
import type { EstadoPedido } from '@/lib/transacciones/types'
import type { AdminActionState } from '@/lib/admin/types'
import { useActionFeedback } from '@/components/ActionFeedback'

export function UserModeration({ id, suspended, version, requestId }: { id: string; suspended: boolean; version: number; requestId: string }) {
  const notify = useActionFeedback()
  const [state, action, pending] = useActionState(async (previous: AdminActionState, form: FormData) => {
    const result = await moderarUsuarioAction(previous, form)
    if (result.success) notify(result.success)
    return result
  }, {})
  const [confirming, setConfirming] = useState(false)
  const [intent] = useState(requestId)
  return <div className="space-y-4"><FormMessage state={state} />{state.success && <a href="/admin/usuarios" className="inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline">Actualizar lista de usuarios</a>}{!state.success && (confirming ? <form action={action} className="space-y-4 rounded-xl border border-gray-200 p-4">
    <input type="hidden" name="usuario_id" value={id} /><input type="hidden" name="suspendido" value={String(!suspended)} /><input type="hidden" name="version_esperada" value={version} /><input type="hidden" name="idempotencia" value={intent} />
    <p className="text-sm font-semibold">{suspended ? '¿Confirmas la reactivación de esta cuenta?' : '¿Confirmas la suspensión de esta cuenta?'}</p>
    <p className="text-sm leading-relaxed text-gray-600">{suspended ? 'Podrá volver a usar su panel. Sus lotes que cumplan los requisitos volverán al catálogo.' : 'No podrá publicar ni comprar. Sus lotes dejarán de aparecer en el catálogo y sus datos se conservarán.'}</p>
    <label className="block space-y-2 text-sm font-semibold" htmlFor={`motivo-${id}`}><span>Motivo de la decisión</span><textarea id={`motivo-${id}`} name="motivo" required minLength={3} maxLength={1000} rows={3} disabled={pending} className={inputClass} /></label>
    <div className="flex flex-wrap gap-3"><button disabled={pending} className={suspended ? buttonClass : 'min-h-11 rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60'}>{pending ? 'Guardando…' : suspended ? 'Sí, reactivar cuenta' : 'Sí, suspender cuenta'}</button><button type="button" disabled={pending} onClick={() => setConfirming(false)} className="min-h-11 px-3 text-sm font-semibold">Volver</button></div>
  </form> : <button onClick={() => setConfirming(true)} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${suspended ? 'border-petroleo/40 text-petroleo' : 'border-red-200 text-red-700'}`}>{suspended ? 'Reactivar cuenta' : 'Suspender cuenta'}</button>)}</div>
}

export function DisputeForm({ id, status, requestId }: { id: string; status: EstadoPedido; requestId: string }) {
  const notify = useActionFeedback()
  const [state, action, pending] = useActionState(async (previous: AdminActionState, form: FormData) => {
    const result = await resolverDisputaAction(previous, form)
    if (result.success) notify(result.success)
    return result
  }, {})
  const [intent] = useState(requestId)
  const [step, setStep] = useState(0)
  const [decision, setDecision] = useState('acuerdo')
  const [resolution, setResolution] = useState('')
  const canCancel = status === 'pendiente' || status === 'confirmado'
  if (state.success) return <FormMessage state={state} />
  return <form action={step === 1 ? action : undefined} onSubmit={event => { if (step === 0) { event.preventDefault(); setStep(1) } }} className="space-y-5">
    <p className="text-xs font-semibold text-gray-500">Paso {step + 1} de 2 · {step === 0 ? 'Resolución de la disputa' : 'Revisar y confirmar'}</p><FormMessage state={state} />
    <input type="hidden" name="pedido_id" value={id} /><input type="hidden" name="estado_esperado" value={status} /><input type="hidden" name="idempotencia" value={intent} />
    <fieldset disabled={pending} className="space-y-5">{step === 0 ? <>
      <label htmlFor="accion-disputa" className="block space-y-2 text-sm font-semibold"><span>Acción</span><select id="accion-disputa" name="accion" className={inputClass} value={decision} onChange={event => setDecision(event.target.value)}><option value="acuerdo">Registrar acuerdo y conservar el estado</option>{canCancel && <option value="cancelar">Cancelar el pedido</option>}</select></label>
      <label htmlFor="resolucion" className="block space-y-2 text-sm font-semibold"><span>Resolución acordada con las partes</span><textarea id="resolucion" name="resolucion" required minLength={10} maxLength={1000} rows={5} value={resolution} onChange={event => setResolution(event.target.value)} className={inputClass} /></label>
      <p className="text-sm leading-relaxed text-gray-600">Se notificará al comprador y al productor. La resolución quedará registrada y no podrá modificarse. {canCancel ? 'Al cancelar un pedido confirmado, su cantidad se devuelve al stock.' : 'Este pedido ya no admite cancelación desde la plataforma.'}</p>
    </> : <><input type="hidden" name="accion" value={decision} /><input type="hidden" name="resolucion" value={resolution} /><div className={`space-y-3 rounded-xl p-4 ${decision === 'cancelar' ? 'bg-red-50 text-red-950' : 'bg-crema text-petroleo'}`}><p className="text-sm font-bold">{decision === 'cancelar' ? 'Cancelar pedido y registrar resolución' : 'Registrar acuerdo sin cambiar el estado'}</p><p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{resolution}</p></div><label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" required className="mt-1" /><span>Confirmo que revisé este caso con las partes y que la resolución es correcta.</span></label></>}</fieldset>
    <div className="flex flex-wrap gap-3">{step === 1 && <button type="button" disabled={pending} onClick={() => setStep(0)} className="min-h-11 rounded-full border border-gray-300 px-5 text-sm font-semibold">Anterior</button>}<button disabled={pending} className={buttonClass}>{pending ? 'Guardando…' : step === 0 ? 'Revisar resolución' : 'Confirmar resolución'}</button></div>
  </form>
}
