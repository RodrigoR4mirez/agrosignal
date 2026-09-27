'use client'

import { useState } from 'react'

// En móvil los filtros se pliegan detrás de un botón; en escritorio quedan siempre visibles.
export function FiltrosPlegables({ activos, children }: { activos: number; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  return <div>
    <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-controls="filtros-catalogo"
      className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[#d9dccd] bg-white px-4 text-sm font-semibold text-bosque lg:hidden">
      <span>Filtros{activos > 0 ? ` (${activos})` : ''}</span><span aria-hidden="true">{abierto ? '−' : '+'}</span>
    </button>
    <div id="filtros-catalogo" className={`${abierto ? 'mt-4 block' : 'hidden'} lg:mt-0 lg:block`}>{children}</div>
  </div>
}

// Cambiar el orden aplica los filtros al instante (con JS); sin JS sirve el botón del formulario.
export function OrdenSelect({ defaultValue, opciones }: { defaultValue: string; opciones: readonly (readonly [string, string])[] }) {
  return <select id="orden" name="orden" defaultValue={defaultValue} onChange={event => event.currentTarget.form?.requestSubmit()}
    className="min-h-11 rounded-xl border border-[#d9dccd] bg-white px-3 text-sm font-semibold text-gray-800 focus:border-bosque focus:outline-2 focus:outline-bosque/20">
    {opciones.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
  </select>
}
