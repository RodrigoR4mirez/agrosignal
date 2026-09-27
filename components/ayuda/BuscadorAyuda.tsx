'use client'

import { useState } from 'react'

const normalizar = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Filtra las preguntas de #preguntas mientras se escribe (sin tildes ni mayúsculas).
export function BuscadorAyuda() {
  const [consulta, setConsulta] = useState('')
  const [visibles, setVisibles] = useState<number | null>(null)
  const buscar = (valor: string) => {
    setConsulta(valor)
    const contenedor = document.getElementById('preguntas')
    if (!contenedor) return
    const texto = normalizar(valor.trim())
    const preguntas = [...contenedor.querySelectorAll<HTMLDetailsElement>('details[data-pregunta]')]
    const coincidencias = preguntas.filter(pregunta => !texto || normalizar(pregunta.textContent ?? '').includes(texto))
    for (const pregunta of preguntas) pregunta.hidden = !coincidencias.includes(pregunta)
    if (texto && coincidencias.length <= 3) for (const pregunta of coincidencias) pregunta.open = true
    for (const tema of contenedor.querySelectorAll<HTMLElement>('[data-tema]')) tema.hidden = !tema.querySelector('details[data-pregunta]:not([hidden])')
    const vacio = document.getElementById('sin-resultados')
    if (vacio) vacio.hidden = coincidencias.length > 0
    setVisibles(texto ? coincidencias.length : null)
  }
  return <div role="search" className="mt-8 max-w-2xl">
    <label htmlFor="buscar-ayuda" className="sr-only">Busca en la ayuda</label>
    <div className="relative">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-petroleo/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input id="buscar-ayuda" type="search" value={consulta} onChange={event => buscar(event.target.value)} placeholder="Busca: contraseña, pedido, dron, BPA…" autoComplete="off"
        className="min-h-14 w-full rounded-full bg-white pl-13 pr-5 text-base text-gray-900 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] placeholder:text-gray-500 focus:outline-2 focus:outline-offset-2 focus:outline-naranja" />
    </div>
    <p aria-live="polite" className="mt-3 min-h-5 text-sm text-white/80">{visibles === null ? '' : visibles ? `${visibles} ${visibles === 1 ? 'pregunta coincide' : 'preguntas coinciden'}` : 'Ninguna pregunta coincide'}</p>
  </div>
}
