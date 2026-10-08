'use client'

import { useActionState, useState } from 'react'
import { guardarPerfilFinca } from '@/app/panel-productor/actions'
import { Field, FormMessage, inputClass } from '@/components/auth/FormFields'
import { buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui/estilos'
import { cn } from '@/lib/utils'
import { ENTREGAS, MESES, PRACTICAS, type PerfilFinca } from '@/lib/perfil/types'

const casilla = 'flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm text-gray-700 ring-1 ring-linea-fuerte has-checked:bg-petroleo has-checked:font-semibold has-checked:text-white has-checked:ring-petroleo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-petroleo'

// Datos de la finca que se muestran en el perfil público del productor.
export function PerfilFincaForm({ inicial }: { inicial: Partial<PerfilFinca> }) {
  const [state, action, pending] = useActionState(guardarPerfilFinca, {})
  const [lat, setLat] = useState(inicial.latitud != null ? String(inicial.latitud) : '')
  const [lon, setLon] = useState(inicial.longitud != null ? String(inicial.longitud) : '')
  const [ubicando, setUbicando] = useState('')
  const [sobre, setSobre] = useState(inicial.sobre_mi ?? '')
  const ubicar = () => {
    if (!navigator.geolocation) { setUbicando('Tu navegador no permite obtener la ubicación. Escribe las coordenadas.'); return }
    setUbicando('Obteniendo tu ubicación…')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLon(pos.coords.longitude.toFixed(6)); setUbicando('Listo. Revisa que sea tu finca antes de guardar.') },
      () => setUbicando('No pudimos obtener tu ubicación. Revisa los permisos o escribe las coordenadas.'),
      { enableHighAccuracy: true, timeout: 15000 })
  }
  const num = (valor: number | null | undefined) => valor == null ? '' : String(valor)
  return <form action={action} className="space-y-6">
    <div className="grid gap-5 sm:grid-cols-2">
      <Field name="finca" label="Nombre de tu finca o chacra" defaultValue={inicial.finca ?? ''} maxLength={80} placeholder="Ej. Fundo Santa Rosa" />
      <Field name="asociacion" label="Asociación o cooperativa (opcional)" defaultValue={inicial.asociacion ?? ''} maxLength={120} />
      <Field name="hectareas" label="Hectáreas en producción" type="number" min="0.01" max="100000" step="0.01" defaultValue={num(inicial.hectareas)} />
      <Field name="anios_experiencia" label="Años de experiencia" type="number" min="0" max="80" step="1" defaultValue={num(inicial.anios_experiencia)} />
      <Field name="altitud_msnm" label="Altitud (m s. n. m.)" type="number" min="0" max="6000" step="1" defaultValue={num(inicial.altitud_msnm)} />
      <Field name="capacidad_mensual_kg" label="Capacidad de producción (kg al mes)" type="number" min="1" step="1" defaultValue={num(inicial.capacidad_mensual_kg)} />
    </div>
    <div className="space-y-2">
      <label htmlFor="sobre_mi" className="block text-sm font-semibold text-gray-800">Cuéntale a los compradores sobre tu finca</label>
      <textarea id="sobre_mi" name="sobre_mi" rows={4} maxLength={600} value={sobre} onChange={event => setSobre(event.target.value)} className={inputClass} placeholder="Qué cultivas, desde cuándo, cómo cuidas la cosecha…" />
      <p className="text-xs text-gray-500">{sobre.length}/600 caracteres</p>
    </div>
    <fieldset className="space-y-3 rounded-2xl bg-crema p-4 sm:p-5">
      <legend className="sr-only">Ubicación de la finca</legend>
      <p className="text-sm font-semibold text-gray-800">Ubicación exacta de la finca</p>
      <p className="text-xs leading-relaxed text-gray-600">Se muestra en un mapa en tu perfil público. Usa tu ubicación estando en la finca, o copia las coordenadas desde Google Maps.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field name="latitud" label="Latitud" type="number" step="0.000001" min="-18.5" max="0.2" value={lat} onChange={event => setLat(event.target.value)} placeholder="-13.531950" />
        <Field name="longitud" label="Longitud" type="number" step="0.000001" min="-81.5" max="-68.5" value={lon} onChange={event => setLon(event.target.value)} placeholder="-71.967463" />
        <button type="button" onClick={ubicar} className={cn(buttonSecondaryClass, 'min-h-12')}>Usar mi ubicación</button>
      </div>
      <p aria-live="polite" className="min-h-4 text-xs text-petroleo">{ubicando}</p>
    </fieldset>
    <fieldset><legend className="mb-3 text-sm font-semibold text-gray-800">Meses de cosecha</legend>
      <div className="flex flex-wrap gap-2">{MESES.map((mes, i) => <label key={mes} className={casilla}><input type="checkbox" name="meses_cosecha" value={i + 1} defaultChecked={inicial.meses_cosecha?.includes(i + 1)} className="sr-only" />{mes}</label>)}</div>
    </fieldset>
    <fieldset><legend className="mb-3 text-sm font-semibold text-gray-800">Cómo produces</legend>
      <div className="flex flex-wrap gap-2">{Object.entries(PRACTICAS).map(([valor, texto]) => <label key={valor} className={casilla}><input type="checkbox" name="practicas" value={valor} defaultChecked={inicial.practicas?.includes(valor)} className="sr-only" />{texto}</label>)}</div>
    </fieldset>
    <fieldset><legend className="mb-3 text-sm font-semibold text-gray-800">Formas de entrega</legend>
      <div className="flex flex-wrap gap-2">{Object.entries(ENTREGAS).map(([valor, texto]) => <label key={valor} className={casilla}><input type="checkbox" name="entregas" value={valor} defaultChecked={inicial.entregas?.includes(valor)} className="sr-only" />{texto}</label>)}</div>
    </fieldset>
    <FormMessage state={state} />
    <button disabled={pending} className={buttonPrimaryClass}>{pending ? 'Guardando…' : 'Guardar perfil'}</button>
  </form>
}
