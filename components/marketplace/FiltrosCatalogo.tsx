'use client'

import { useEffect, useRef, useState } from 'react'

// En móvil los filtros se pliegan detrás de un botón y se aplican juntos; en escritorio quedan visibles.
export function FiltrosPlegables({ activos, children }: { activos: number; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)
  return <div>
    <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} aria-controls="filtros-catalogo"
      className="flex min-h-12 w-full items-center justify-between rounded-full border border-[#e2dbc9] bg-white px-5 text-sm font-semibold text-petroleo lg:hidden">
      <span className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
        Filtros{activos > 0 && <span className="grid size-5 place-items-center rounded-full bg-naranja text-[11px] text-petroleo">{activos}</span>}
      </span>
      <span aria-hidden="true" className="text-lg leading-none">{abierto ? '−' : '+'}</span>
    </button>
    <div id="filtros-catalogo" className={`${abierto ? 'mt-4 block' : 'hidden'} lg:mt-0 lg:block`}>{children}</div>
  </div>
}

// En escritorio cada cambio de filtro u orden se aplica al instante; en móvil solo el orden
// (los filtros se aplican con el botón, para no recargar a cada toque). Sin JS sirven los botones.
export function EnvioAutomatico() {
  const marca = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const form = marca.current?.closest('form')
    if (!form) return
    const escritorio = window.matchMedia('(min-width: 1024px)')
    const alCambiar = (event: Event) => {
      const campo = event.target as HTMLInputElement
      if (campo.name === 'q') return
      if (campo.name === 'orden' || escritorio.matches) form.requestSubmit()
    }
    form.addEventListener('change', alCambiar)
    return () => form.removeEventListener('change', alCambiar)
  }, [])
  return <span ref={marca} hidden />
}
