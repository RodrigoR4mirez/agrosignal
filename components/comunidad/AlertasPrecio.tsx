'use client'

import { useActionState } from 'react'
import { borrarAlertaAction, crearAlertaAction } from '@/app/panel-comprador/actions'
import { Field, FormMessage, buttonClass } from '@/components/auth/FormFields'
import type { AlertaPrecio } from '@/lib/comunidad/types'

// Alertas por cultivo: avisan cuando se publica o rebaja un lote que coincide.
export function AlertasPrecio({ alertas }: { alertas: AlertaPrecio[] }) {
  const [state, action, pending] = useActionState(crearAlertaAction, {})
  return <div className="space-y-5">
    <form key={alertas.length} action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field name="cultivo" label="Cultivo" required minLength={2} maxLength={60} placeholder="Ej. palta" />
      <Field name="precio_maximo_kg" label="Precio máximo por kg (opcional)" type="number" min="0.01" step="0.01" placeholder="Ej. 6.00" />
      <button disabled={pending || alertas.length >= 10} className={`${buttonClass} min-h-12`}>{pending ? 'Creando…' : 'Crear alerta'}</button>
    </form>
    <FormMessage state={state} />
    {alertas.length > 0 ? <ul className="flex flex-wrap gap-2">{alertas.map(a => <li key={a.id} className="inline-flex items-center gap-2 rounded-full bg-crema py-1.5 pl-4 pr-1.5 text-sm text-petroleo ring-1 ring-[#e2dbc9]">
      <span><strong className="font-semibold">{a.cultivo}</strong>{a.precio_maximo_kg ? ` · hasta S/ ${Number(a.precio_maximo_kg).toFixed(2)}/kg` : ' · cualquier precio'}</span>
      <form action={borrarAlertaAction}><input type="hidden" name="alerta_id" value={a.id} /><button aria-label={`Borrar alerta de ${a.cultivo}`} className="grid size-7 place-items-center rounded-full bg-white text-xs hover:bg-red-50 hover:text-red-700">✕</button></form>
    </li>)}</ul> : <p className="text-sm text-gray-600">Aún no tienes alertas. Crea una y te avisaremos en tus notificaciones.</p>}
    <p className="text-xs text-gray-500">{alertas.length}/10 alertas. Coinciden por nombre: “palta” incluye Palta Hass y Palta Fuerte.</p>
  </div>
}
