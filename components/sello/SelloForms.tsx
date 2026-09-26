'use client'

import { useActionState, useState } from 'react'
import { subirCertificado, solicitarDron, revisarCertificado, completarDron, registrarTest } from '@/app/sello/actions'
import { Field, FormMessage, buttonClass, inputClass } from '@/components/auth/FormFields'
import { ProofUpload } from './ProofUpload'

type Props = { lotId: string; owner: string; today: string }
export function CertificateForm({ lotId, owner, today }: Props) {
  const [state, action, pending] = useActionState(subirCertificado, {})
  const [step, setStep] = useState(0)
  const [type, setType] = useState('senasa')
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [paths, setPaths] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  if (state.success) return <div className="space-y-4"><FormMessage state={state} /><p className="text-sm text-gray-600">Tu documento está en revisión. Recibirás una notificación cuando la administración lo revise.</p><a href={`/verificaciones/${lotId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#1a5c2a] underline">Actualizar verificaciones o subir otro documento</a></div>
  return <form action={step === 1 ? action : undefined} onSubmit={event => { if (step === 0) { event.preventDefault(); setStep(1) } }} className="space-y-5">
    <p className="text-xs font-semibold text-gray-500">Paso {step + 1} de 2 · {step === 0 ? 'Datos del certificado' : 'Archivo de respaldo'}</p><FormMessage state={state} />
    <input type="hidden" name="lote_id" value={lotId} />
    <fieldset disabled={pending || busy} className="space-y-5">
      {step === 0 ? <><div className="space-y-2"><label htmlFor="tipo_certificado" className="block text-sm font-semibold">Tipo de certificado</label><select id="tipo_certificado" name="tipo" value={type} onChange={event => setType(event.target.value)} className={inputClass}><option value="senasa">SENASA</option><option value="global_gap">GLOBAL G.A.P.</option><option value="otro">Otro</option></select></div><Field name="numero" label="Número del certificado" required maxLength={100} value={number} onChange={event => setNumber(event.target.value)} /><Field name="fecha_vencimiento" label="Fecha de vencimiento" type="date" min={today} required value={expiry} onChange={event => setExpiry(event.target.value)} /></> : <><input type="hidden" name="tipo" value={type} /><input type="hidden" name="numero" value={number} /><input type="hidden" name="fecha_vencimiento" value={expiry} /><p className="rounded-xl bg-green-50 p-4 text-sm wrap-anywhere">Certificado {number} · vence {expiry}</p><ProofUpload bucket="certificados" owner={owner} lotId={lotId} onReady={setPaths} onBusy={setBusy} disabled={pending} /></>}
    </fieldset>
    <input type="hidden" name="archivo_path" value={paths[0] ?? ''} />
    <div className="flex flex-wrap gap-3">{step === 1 && <button type="button" disabled={pending || busy} onClick={() => setStep(0)} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold">Anterior</button>}<button disabled={pending || busy || (step === 1 && !paths.length)} className={buttonClass}>{pending ? 'Enviando…' : step === 0 ? 'Continuar' : 'Enviar a revisión'}</button></div>
  </form>
}

export function DronRequest({ lotId }: { lotId: string }) {
  const [state, action, pending] = useActionState(solicitarDron, {})
  return <form action={action} className="space-y-4"><input type="hidden" name="lote_id" value={lotId} /><FormMessage state={state} /><p className="text-sm leading-relaxed text-gray-600">Solicita una inspección de tu lote. La administración coordinará el vuelo y registrará la evidencia cuando se realice.</p>{!state.success && <button disabled={pending} className={buttonClass}>{pending ? 'Solicitando…' : 'Solicitar inspección con dron'}</button>}</form>
}

export function CertificateReview({ lotId, certificateId }: { lotId: string; certificateId: string }) {
  const [state, action, pending] = useActionState(revisarCertificado, {})
  const [decision, setDecision] = useState<'aprobado' | 'rechazado' | null>(null)
  const [reason, setReason] = useState('')
  return <div className="space-y-4"><FormMessage state={state} />{!state.success && (decision ? <form action={action} className="space-y-4 rounded-xl border border-gray-200 p-4"><input type="hidden" name="lote_id" value={lotId} /><input type="hidden" name="certificado_id" value={certificateId} /><input type="hidden" name="estado" value={decision} /><p className="text-sm font-semibold">{decision === 'aprobado' ? '¿Confirmas que revisaste y apruebas este documento?' : '¿Confirmas el rechazo del documento?'}</p>{decision === 'rechazado' && <div className="space-y-2"><label htmlFor={`motivo-${certificateId}`} className="block text-sm font-semibold">Motivo del rechazo</label><textarea id={`motivo-${certificateId}`} name="motivo_rechazo" required minLength={3} maxLength={1000} rows={3} className={inputClass} value={reason} onChange={event => setReason(event.target.value)} disabled={pending} /></div>}<div className="flex flex-wrap gap-3"><button disabled={pending} className={buttonClass}>{pending ? 'Guardando…' : decision === 'aprobado' ? 'Sí, aprobar certificado' : 'Sí, rechazar certificado'}</button><button type="button" disabled={pending} onClick={() => setDecision(null)} className="min-h-11 px-3 text-sm font-semibold">Volver</button></div></form> : <div className="flex flex-wrap gap-3"><button onClick={() => setDecision('aprobado')} className={buttonClass}>Aprobar</button><button onClick={() => setDecision('rechazado')} className="min-h-11 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700">Rechazar</button></div>)}</div>
}

export function DronResultForm({ lotId, owner, today, inspectionId }: Props & { inspectionId: string }) {
  const [state, action, pending] = useActionState(completarDron, {})
  const [step, setStep] = useState(0)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [paths, setPaths] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  if (state.success) return <FormMessage state={state} />
  return <form action={step === 1 ? action : undefined} onSubmit={event => { if (step === 0) { event.preventDefault(); setStep(1) } }} className="space-y-5">
    <p className="text-xs font-semibold text-gray-500">Paso {step + 1} de 2 · {step === 0 ? 'Datos del vuelo' : 'Evidencia de la inspección'}</p><FormMessage state={state} />
    <input type="hidden" name="lote_id" value={lotId} /><input type="hidden" name="inspeccion_id" value={inspectionId} />
    <fieldset disabled={pending || busy} className="space-y-5">{step === 0 ? <><div className="grid gap-4 sm:grid-cols-2"><Field name="latitud" label="Latitud GPS" type="number" min="-90" max="90" step="any" required value={latitude} onChange={event => setLatitude(event.target.value)} /><Field name="longitud" label="Longitud GPS" type="number" min="-180" max="180" step="any" required value={longitude} onChange={event => setLongitude(event.target.value)} /></div><Field name="fecha_vuelo" label="Fecha del vuelo" type="date" max={today} required value={date} onChange={event => setDate(event.target.value)} /><div className="space-y-2"><label htmlFor={`notas-${inspectionId}`} className="block text-sm font-semibold">Notas de la inspección (opcional)</label><textarea id={`notas-${inspectionId}`} name="notas" maxLength={2000} rows={3} value={notes} onChange={event => setNotes(event.target.value)} className={inputClass} /></div></> : <><input type="hidden" name="latitud" value={latitude} /><input type="hidden" name="longitud" value={longitude} /><input type="hidden" name="fecha_vuelo" value={date} /><input type="hidden" name="notas" value={notes} /><ProofUpload bucket="evidencia-drones" owner={owner} lotId={lotId} onReady={setPaths} onBusy={setBusy} disabled={pending} /><p className="text-sm text-gray-600">El resultado quedará registrado como completado con esta evidencia.</p></>}</fieldset>
    <input type="hidden" name="evidencia_paths" value={JSON.stringify(paths)} />
    <div className="flex flex-wrap gap-3">{step === 1 && <button type="button" disabled={pending || busy} onClick={() => setStep(0)} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold">Anterior</button>}<button disabled={pending || busy || (step === 1 && !paths.length)} className={buttonClass}>{pending ? 'Guardando…' : step === 0 ? 'Continuar' : 'Completar inspección'}</button></div>
  </form>
}

export function TestForm({ lotId, owner, today }: Props) {
  const [state, action, pending] = useActionState(registrarTest, {})
  const [step, setStep] = useState(0)
  const [kit, setKit] = useState('')
  const [date, setDate] = useState(today)
  const [result, setResult] = useState('pasa')
  const [confirmed, setConfirmed] = useState(false)
  const [paths, setPaths] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  if (state.success) return <div className="space-y-4"><FormMessage state={state} /><a href={`/verificaciones/${lotId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#1a5c2a] underline">Actualizar verificaciones</a></div>
  return <form action={step === 1 ? action : undefined} onSubmit={event => { if (step === 0) { event.preventDefault(); setStep(1) } }} className="space-y-5">
    <p className="text-xs font-semibold text-gray-500">Paso {step + 1} de 2 · {step === 0 ? 'Datos del test' : 'Evidencia y confirmación'}</p><FormMessage state={state} /><input type="hidden" name="lote_id" value={lotId} />
    <fieldset disabled={pending || busy} className="space-y-5">{step === 0 ? <><Field name="tipo_kit" label="Tipo o marca del kit" minLength={2} maxLength={120} required value={kit} onChange={event => setKit(event.target.value)} /><Field name="fecha_prueba" label="Fecha de la prueba" type="date" max={today} required value={date} onChange={event => setDate(event.target.value)} /><div className="space-y-2"><label htmlFor="resultado" className="block text-sm font-semibold">Resultado</label><select id="resultado" name="resultado" value={result} onChange={event => { setResult(event.target.value); setConfirmed(false) }} className={inputClass}><option value="pasa">Pasa</option><option value="no_pasa">No pasa</option></select></div></> : <><input type="hidden" name="tipo_kit" value={kit} /><input type="hidden" name="fecha_prueba" value={date} /><input type="hidden" name="resultado" value={result} /><p className={`rounded-xl p-4 text-sm font-semibold ${result === 'no_pasa' ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'}`}>{kit} · {date} · {result === 'pasa' ? 'Pasa' : 'No pasa'}</p><ProofUpload bucket="evidencia-tests" owner={owner} lotId={lotId} onReady={setPaths} onBusy={setBusy} disabled={pending} /><label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-sm leading-relaxed"><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} className="mt-1" /><span>{result === 'no_pasa' ? 'Confirmo el resultado No pasa. Este lote quedará bloqueado, saldrá del marketplace y se notificará al productor y a la administración.' : 'Confirmo que el resultado y la evidencia corresponden a este lote. El registro se conservará sin modificaciones.'}</span></label></>}</fieldset>
    <input type="hidden" name="foto_path" value={paths[0] ?? ''} />
    <div className="flex flex-wrap gap-3">{step === 1 && <button type="button" disabled={pending || busy} onClick={() => setStep(0)} className="min-h-11 rounded-xl border border-gray-300 px-4 text-sm font-semibold">Anterior</button>}<button disabled={pending || busy || (step === 1 && (!paths.length || !confirmed))} className={step === 1 && result === 'no_pasa' ? 'inline-flex min-h-11 items-center justify-center rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-wait disabled:opacity-60' : buttonClass}>{pending ? 'Registrando…' : step === 0 ? 'Continuar' : result === 'no_pasa' ? 'Registrar y bloquear lote' : 'Registrar test'}</button></div>
  </form>
}
