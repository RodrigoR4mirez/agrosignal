'use client'

import { useActionState, useState } from 'react'
import { guardarPerfilComprador } from '@/app/panel-comprador/actions'
import { Field, FormMessage, inputClass } from '@/components/auth/FormFields'
import type { Profile } from '@/lib/supabase/types'
import { buttonPrimaryClass } from '@/components/ui/estilos'

// Datos que ven los productores con los que el comprador tiene pedidos.
export function PerfilCompradorForm({ inicial }: { inicial: Profile }) {
  const [state, action, pending] = useActionState(guardarPerfilComprador, {})
  const [sobre, setSobre] = useState(inicial.sobre_mi ?? '')
  return <form action={action} className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <Field name="empresa" label="Empresa o razón social (opcional)" defaultValue={inicial.empresa ?? ''} maxLength={120} placeholder="Ej. Frutas del Norte S.A.C." />
      <Field name="rubro" label="Rubro" defaultValue={inicial.rubro ?? ''} maxLength={80} placeholder="Ej. Agroexportación, restaurante, mayorista" />
      <Field name="cultivos_interes" label="Cultivos que buscas" defaultValue={(inicial.cultivos_interes ?? []).join(', ')} placeholder="Palta, mango, arándano" hint="Sepáralos con comas (hasta 12)." />
      <Field name="volumen_mensual_kg" label="Volumen que compras (kg al mes)" type="number" min="1" step="1" defaultValue={inicial.volumen_mensual_kg == null ? '' : String(inicial.volumen_mensual_kg)} />
      <Field name="mercados_destino" label="Destinos de tu compra" defaultValue={(inicial.mercados_destino ?? []).join(', ')} placeholder="Lima, Estados Unidos, Países Bajos" hint="Ciudades o países, separados por comas (hasta 10)." />
    </div>
    <div className="space-y-2">
      <label htmlFor="sobre_mi_comprador" className="block text-sm font-semibold text-gray-800">Preséntate a los productores</label>
      <textarea id="sobre_mi_comprador" name="sobre_mi" rows={3} maxLength={600} value={sobre} onChange={event => setSobre(event.target.value)} className={inputClass} placeholder="Qué haces con la cosecha, qué calidad buscas, cómo pagas…" />
      <p className="text-xs text-gray-500">{sobre.length}/600 caracteres</p>
    </div>
    <FormMessage state={state} />
    <button disabled={pending} className={buttonPrimaryClass}>{pending ? 'Guardando…' : 'Guardar perfil'}</button>
  </form>
}
