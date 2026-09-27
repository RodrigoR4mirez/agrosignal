'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { prepareLot, saveLot } from '@/app/panel-productor/actions'
import { Field, FormMessage, buttonClass, inputClass } from '@/components/auth/FormFields'
import { COSECHA, MAX_FOTOS, REGIONES, photoUrl, type Lote } from '@/lib/marketplace/types'
import type { ActionState } from '@/lib/supabase/types'

type Photo = { path?: string; preview: string; file?: File }
const steps = ['Cultivo y ubicación', 'Oferta de cosecha', 'Fotos y publicación']
export function LotWizard({ owner, id, initial, recoveredPhotos = [] }: { owner: string; id: string; initial?: Lote; recoveredPhotos?: string[] }) {
  const router = useRouter()
  const [lotId] = useState(id)
  const [step, setStep] = useState(0)
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<ActionState>({})
  const [progress, setProgress] = useState('')
  const [values, setValues] = useState<Record<string, string>>({
    cultivo: initial?.cultivo ?? '', region: initial?.region ?? '', provincia: initial?.provincia ?? '', distrito: initial?.distrito ?? '',
    cantidad_disponible: initial ? String(initial.cantidad_disponible) : '', precio_unidad: initial ? String(initial.precio_unidad) : '', precio_anterior: initial?.precio_anterior ? String(initial.precio_anterior) : '',
    unidad: initial?.unidad ?? 'kg', estado_cosecha: initial?.estado_cosecha ?? 'disponible', nivel_riesgo: initial?.nivel_riesgo ?? 'medio', destino: initial?.destino ?? 'local', descripcion: initial?.descripcion ?? '',
  })
  const [photos, setPhotos] = useState<Photo[]>(() => [...new Set([...(initial?.fotos ?? []), ...recoveredPhotos])].slice(0, MAX_FOTOS).flatMap(path => {
    const preview = photoUrl(path)
    return preview ? [{ path, preview }] : []
  }))
  const update = (key: string, value: string) => setValues(previous => ({ ...previous, [key]: value }))
  const field = (key: string) => ({ name: key, value: values[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value) })
  const select = (key: string, label: string, options: Record<string, string>) => <div className="space-y-2"><label htmlFor={key} className="block text-sm font-semibold">{label}</label><select id={key} name={key} value={values[key]} onChange={event => update(key, event.target.value)} required className={inputClass}>{Object.entries(options).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
  async function addPhotos(files: FileList | null) {
    if (!files) return
    setState({})
    if (photos.length + files.length > MAX_FOTOS) { setState({ error: `Puedes agregar hasta ${MAX_FOTOS} fotos por lote.` }); return }
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setState({ error: 'Usa fotos JPG, PNG o WebP.' }); return }
      if (file.size > 5 * 1024 * 1024 || file.size === 0) { setState({ error: 'Cada foto debe pesar más de 0 y hasta 5 MB.' }); return }
    }
    const additions = Array.from(files).map(file => ({ file, preview: URL.createObjectURL(file) }))
    setPhotos(previous => [...previous, ...additions])
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    if (step === 1 && values.precio_anterior && !(Number(values.precio_anterior) > Number(values.precio_unidad))) { setState({ error: 'El precio antes del descuento debe ser mayor que el precio actual, o déjalo vacío.' }); return }
    if (step < 2) { setState({}); setStep(step + 1); return }
    if (!photos.length) { setState({ error: 'Agrega al menos una foto de tu lote.' }); return }
    setPending(true); setState({}); setProgress('Guardando borrador…')
    const form = new FormData()
    for (const [key, value] of Object.entries(values)) form.set(key, value)
    form.set('id', lotId)
    try {
      const prepared = await prepareLot(form)
      if (prepared.error) { setState(prepared); return }
      const db = createClient()
      const uploaded = [...photos]
      for (let index = 0; index < uploaded.length; index++) {
        const photo = uploaded[index]
        if (photo.path || !photo.file) continue
        setProgress(`Subiendo foto ${index + 1} de ${uploaded.length}…`)
        const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[photo.file.type]
        const path = `${owner}/${lotId}/${crypto.randomUUID()}.${extension}`
        const result = await db.storage.from('fotos-lotes').upload(path, photo.file, { contentType: photo.file.type, upsert: false })
        if (result.error) { setState({ error: 'No pudimos subir una foto. Intenta otra vez; tu borrador está guardado en Mis lotes.' }); return }
        uploaded[index] = { ...photo, path }
        setPhotos([...uploaded])
      }
      setProgress('Publicando lote…')
      form.set('fotos', JSON.stringify(uploaded.map(photo => photo.path)))
      const result = await saveLot(form)
      if (result.error) { setState(result); return }
      for (const photo of uploaded) if (photo.preview.startsWith('blob:')) URL.revokeObjectURL(photo.preview)
      router.push(`/panel-productor/mis-lotes?guardado=1${result.cleanupWarning ? '&limpieza=1' : ''}`)
      router.refresh()
    } catch { setState({ error: 'No pudimos conectar. Revisa tu conexión e intenta nuevamente. Si el borrador se guardó, lo encontrarás en Mis lotes.' }) }
    finally { setPending(false); setProgress('') }
  }
  return <div className="mx-auto w-full max-w-3xl">
    <ol aria-label="Pasos para publicar" className="mb-8 grid grid-cols-3 gap-2">{steps.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={`rounded-xl p-3 text-xs font-semibold sm:text-sm ${step === index ? 'bg-petroleo text-white' : 'bg-crema text-petroleo'}`}><span className="mb-1 block">Paso {index + 1}</span>{label}</li>)}</ol>
    <form onSubmit={submit} className="card-surface space-y-6 border border-gray-100 bg-white p-5 sm:p-8">
      <h2 className="text-xl font-semibold text-petroleo">{steps[step]}</h2>
      <FormMessage state={state} />
      <fieldset disabled={pending} className="space-y-5">
        {step === 0 && <>
          <Field {...field('cultivo')} label="Cultivo o variedad" placeholder="Ej. Palta Hass" required minLength={2} maxLength={100} />
          {select('region', 'Región', Object.fromEntries([['', 'Selecciona tu región'], ...REGIONES.map(region => [region, region])]))}
          <div className="grid gap-5 sm:grid-cols-2"><Field {...field('provincia')} label="Provincia" required minLength={2} maxLength={80} /><Field {...field('distrito')} label="Distrito" required minLength={2} maxLength={80} /></div>
        </>}
        {step === 1 && <>
          <div className="grid gap-5 sm:grid-cols-2"><Field {...field('cantidad_disponible')} label="Cantidad disponible" type="number" min="0" max="99999999999.999" step="0.001" required hint="Con cantidad 0, el lote queda agotado y fuera del catálogo." />{select('unidad', 'Unidad', { kg: 'Kilogramos (kg)', ton: 'Toneladas (ton)' })}</div>
          <div className="grid gap-5 sm:grid-cols-2"><Field {...field('precio_unidad')} label={`Precio por ${values.unidad} (S/)`} type="number" min="0.01" max="999999999999.99" step="0.01" required /><Field {...field('precio_anterior')} label="Precio antes del descuento (opcional)" type="number" min="0.01" max="999999999999.99" step="0.01" hint="Si rebajaste el precio, escribe el anterior: el catálogo mostrará el porcentaje de descuento." /></div>
          <div className="grid gap-5 sm:grid-cols-2">{select('estado_cosecha', 'Estado de cosecha', COSECHA)}{select('destino', 'Destino de venta', { local: 'Mercado local', exportacion: 'Exportación' })}</div>
          {select('nivel_riesgo', 'Riesgo declarado por el productor', { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' })}
          <div className="space-y-2"><label htmlFor="descripcion" className="block text-sm font-semibold">Descripción (opcional)</label><textarea id="descripcion" name="descripcion" value={values.descripcion} onChange={event => update('descripcion', event.target.value)} maxLength={300} rows={4} className={inputClass} /><p className="text-xs text-gray-500">{values.descripcion.length}/300 caracteres</p></div>
        </>}
        {step === 2 && <>
          <div className="rounded-xl bg-crema p-4 text-sm leading-relaxed text-petroleo"><p className="wrap-anywhere font-bold">{values.cultivo} · {values.region}</p><p>{values.cantidad_disponible} {values.unidad} · S/ {values.precio_unidad} por {values.unidad}{values.precio_anterior && ` (antes S/ ${values.precio_anterior})`}</p><p>{values.provincia}, {values.distrito}</p></div>
          <div className="space-y-2"><label htmlFor="fotos" className="block text-sm font-semibold">Fotos del lote ({photos.length}/{MAX_FOTOS})</label><input id="fotos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={pending || photos.length >= 6} onChange={event => { void addPhotos(event.target.files); event.target.value = '' }} className={`${inputClass} text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-crema file:px-3 file:py-2 file:font-semibold file:text-petroleo`} /><p className="text-xs text-gray-600">De 1 a 6 fotos propias, JPG, PNG o WebP. Hasta 5 MB por foto. La primera será la portada.</p></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{photos.map((photo, index) => <div key={photo.preview} className="overflow-hidden rounded-xl border border-gray-200"><div className="relative aspect-square"><Image unoptimized fill src={photo.preview} alt={`Foto ${index + 1} del lote`} className="object-cover" sizes="200px" /></div><button type="button" disabled={pending} onClick={() => { if (photo.preview.startsWith('blob:')) URL.revokeObjectURL(photo.preview); setPhotos(previous => previous.filter((_, i) => i !== index)) }} className="min-h-11 w-full px-2 text-sm font-semibold text-red-700">Quitar foto {index + 1}</button></div>)}</div>
          <p className="text-sm leading-relaxed text-gray-600">Al publicar, la información y las fotos serán visibles en el marketplace. Un lote agotado o bloqueado permanece visible solo en tu gestión.</p>
        </>}
      </fieldset>
      {pending && <p role="status" className="text-sm font-semibold text-petroleo">{progress}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
        {step > 0 ? <button type="button" disabled={pending} onClick={() => { setState({}); setStep(step - 1) }} className="min-h-11 rounded-full border border-gray-300 px-5 text-sm font-semibold">Anterior</button> : <Link href="/panel-productor/mis-lotes" className="py-3 text-sm font-semibold text-gray-600 underline">Cancelar</Link>}
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? 'Guardando…' : step < 2 ? 'Continuar' : initial && !initial.borrador ? 'Guardar cambios' : 'Publicar lote'}</button>
      </div>
    </form>
  </div>
}
