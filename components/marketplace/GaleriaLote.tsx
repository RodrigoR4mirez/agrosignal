'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react'

const vidrio = 'bg-white/60 text-petroleo ring-1 ring-white/70 backdrop-blur-xl backdrop-saturate-150'
const vidrioOscuro = 'bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-xl'
const ESCALA_MAX = 4

// Galería de la ficha del lote: con varias fotos, una pila de tarjetas que se abre en abanico;
// con una sola, una tarjeta simple. Al hacer clic se abre el visor a pantalla completa.
export function GaleriaLote({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [abierta, setAbierta] = useState<number | null>(null)
  const varias = fotos.length > 1
  if (!fotos.length) return <div className="grid aspect-4/3 place-items-center rounded-[22px] bg-white text-sm text-gray-600 ring-1 ring-[#ebe4d4]">Este lote no tiene fotos disponibles.</div>
  const detras = fotos.slice(1, 3)
  const capas = ['translate-x-2 -translate-y-2 rotate-1 group-hover:translate-x-3.5 group-hover:-translate-y-3 group-hover:rotate-2', 'translate-x-4 -translate-y-4 rotate-2 group-hover:translate-x-7 group-hover:-translate-y-5 group-hover:rotate-4']

  return <div>
    <div className={`group relative ${varias ? 'mr-5 mt-6 sm:mr-7 sm:mt-8' : ''}`}>
      {detras.map((url, i) => <div key={url} aria-hidden="true" style={{ zIndex: 2 - i }} className={`absolute inset-0 overflow-hidden rounded-[22px] bg-crema shadow-[0_18px_40px_-24px_rgba(19,53,53,0.55)] ring-4 ring-white transition-transform duration-500 ease-out motion-reduce:transition-none ${capas[i]}`}>
        <Image src={url} alt="" fill unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover opacity-90" />
      </div>)}
      <button type="button" onClick={() => setAbierta(0)} className="relative z-10 block aspect-4/3 w-full overflow-hidden rounded-[22px] bg-crema shadow-[0_24px_50px_-28px_rgba(19,53,53,0.6)] ring-4 ring-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-petroleo">
        <Image src={fotos[0]} alt={alt} fill unoptimized priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
          {varias ? <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${vidrio}`}><IconoPila />{fotos.length} fotos</span> : <span />}
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${vidrio}`}><IconoLupa />{varias ? 'Ver fotos' : 'Ampliar'}</span>
        </span>
      </button>
    </div>
    {varias && <ul className="mt-4 grid grid-cols-5 gap-2 sm:gap-3" aria-label="Miniaturas">{fotos.map((url, i) => <li key={url}>
      <button type="button" onClick={() => setAbierta(i)} aria-label={`Ver foto ${i + 1} de ${fotos.length}`} className="relative block aspect-square w-full overflow-hidden rounded-xl bg-crema ring-1 ring-[#ebe4d4] transition hover:ring-2 hover:ring-petroleo/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo">
        <Image src={url} alt="" fill unoptimized sizes="120px" className="object-cover" />
      </button>
    </li>)}</ul>}
    {abierta !== null && <Visor fotos={fotos} alt={alt} inicio={abierta} onCerrar={() => setAbierta(null)} />}
  </div>
}

type Vista = { s: number; x: number; y: number }
const REPOSO: Vista = { s: 1, x: 0, y: 0 }

// Visor a pantalla completa con fondo desenfocado: zoom al punto (doble clic o doble toque,
// rueda, pellizco o botones), arrastre con zoom, deslizar o flechas para cambiar de foto.
function Visor({ fotos, alt, inicio, onCerrar }: { fotos: string[]; alt: string; inicio: number; onCerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const escenario = useRef<HTMLDivElement>(null)
  const punteros = useRef(new Map<number, { x: number; y: number }>())
  const gesto = useRef<{ dist: number; s: number; x0: number; y0: number; vista: Vista; movio: boolean; ultimoToque: number }>({ dist: 0, s: 1, x0: 0, y0: 0, vista: REPOSO, movio: false, ultimoToque: 0 })
  const [indice, setIndice] = useState(inicio)
  const [vista, setVista] = useState<Vista>(REPOSO)
  const [activo, setActivo] = useState(false)
  const [desliz, setDesliz] = useState(0)
  const varias = fotos.length > 1

  useEffect(() => {
    const d = dialogo.current
    d?.showModal()
    const html = document.documentElement, antes = html.style.overflow
    html.style.overflow = 'hidden'
    return () => { html.style.overflow = antes; if (d?.open) d.close() }
  }, [])
  useEffect(() => {
    for (const vecino of [fotos[(indice + 1) % fotos.length], fotos[(indice - 1 + fotos.length) % fotos.length]]) { const img = new window.Image(); img.src = vecino }
  }, [indice, fotos])

  function limitar(v: Vista): Vista {
    const r = escenario.current?.getBoundingClientRect()
    if (!r || v.s <= 1) return REPOSO
    const mx = (r.width * (v.s - 1)) / 2, my = (r.height * (v.s - 1)) / 2
    return { s: v.s, x: Math.max(-mx, Math.min(mx, v.x)), y: Math.max(-my, Math.min(my, v.y)) }
  }
  // Escala manteniendo fijo el punto (cx, cy) de la pantalla.
  function zoomEn(v: Vista, s: number, cx?: number, cy?: number): Vista {
    const r = escenario.current?.getBoundingClientRect()
    const nueva = Math.max(1, Math.min(ESCALA_MAX, s))
    if (!r) return { ...v, s: nueva }
    const px = (cx ?? r.left + r.width / 2) - r.left - r.width / 2, py = (cy ?? r.top + r.height / 2) - r.top - r.height / 2
    const k = nueva / v.s
    return limitar({ s: nueva, x: px - (px - v.x) * k, y: py - (py - v.y) * k })
  }
  function ir(paso: number) { setIndice(i => (i + paso + fotos.length) % fotos.length); setVista(REPOSO) }

  useEffect(() => {
    const el = escenario.current
    if (!el) return
    const rueda = (e: WheelEvent) => { e.preventDefault(); setVista(v => zoomEn(v, v.s * Math.exp(-e.deltaY * 0.0025), e.clientX, e.clientY)) }
    el.addEventListener('wheel', rueda, { passive: false })
    return () => el.removeEventListener('wheel', rueda)
  })

  function alBajar(e: EventoPuntero<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesto.current, ps = [...punteros.current.values()]
    g.vista = vista; g.x0 = e.clientX; g.y0 = e.clientY; g.movio = false
    if (ps.length === 2) { g.dist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y); g.s = vista.s }
    setActivo(true)
  }
  function alMover(e: EventoPuntero<HTMLDivElement>) {
    if (!punteros.current.has(e.pointerId)) return
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesto.current, ps = [...punteros.current.values()]
    if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 6) g.movio = true
    if (ps.length === 2 && g.dist) {
      const dist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y)
      setVista(v => zoomEn(v, g.s * (dist / g.dist), (ps[0].x + ps[1].x) / 2, (ps[0].y + ps[1].y) / 2))
    } else if (ps.length === 1) {
      if (g.vista.s > 1) setVista(limitar({ ...g.vista, x: g.vista.x + e.clientX - g.x0, y: g.vista.y + e.clientY - g.y0 }))
      else if (varias) setDesliz(e.clientX - g.x0)
    }
  }
  function alSoltar(e: EventoPuntero<HTMLDivElement>) {
    const g = gesto.current
    punteros.current.delete(e.pointerId)
    if (punteros.current.size) return
    setActivo(false)
    if (vista.s === 1 && Math.abs(desliz) > 60) ir(desliz < 0 ? 1 : -1)
    setDesliz(0)
    if (!g.movio && e.pointerType !== 'mouse') {
      if (e.timeStamp - g.ultimoToque < 300) { setVista(v => v.s > 1 ? REPOSO : zoomEn(v, 2.5, e.clientX, e.clientY)); g.ultimoToque = 0 } else g.ultimoToque = e.timeStamp
    }
  }
  function alTeclado(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight' && varias) ir(1)
    else if (e.key === 'ArrowLeft' && varias) ir(-1)
    else if (e.key === '+' || e.key === '=') setVista(v => zoomEn(v, v.s * 1.5))
    else if (e.key === '-') setVista(v => zoomEn(v, v.s / 1.5))
    else if (e.key === '0') setVista(REPOSO)
    else return
    e.preventDefault()
  }

  const boton = `grid size-10 place-items-center rounded-full transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white disabled:opacity-40`
  return <dialog ref={dialogo} aria-label={`Fotos: ${alt}`} onClose={onCerrar} onKeyDown={alTeclado}
    className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 text-white backdrop:bg-[#0c2323]/80 backdrop:backdrop-blur-2xl">
    <div className="flex h-full flex-col pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6">
        <p aria-live="polite" className={`rounded-full px-4 py-2 text-sm font-semibold tabular-nums ${vidrioOscuro}`}>{varias ? `${indice + 1} / ${fotos.length}` : '1 foto'}</p>
        <div className={`flex items-center gap-0.5 rounded-full p-1 ${vidrioOscuro}`}>
          <button type="button" className={boton} onClick={() => setVista(v => zoomEn(v, v.s / 1.5))} disabled={vista.s <= 1} aria-label="Alejar"><IconoZoom menos /></button>
          <span className="w-12 text-center text-xs font-semibold tabular-nums">{Math.round(vista.s * 100)}%</span>
          <button type="button" className={boton} onClick={() => setVista(v => zoomEn(v, v.s * 1.5))} disabled={vista.s >= ESCALA_MAX} aria-label="Acercar"><IconoZoom /></button>
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-white/25" />
          <button type="button" className={boton} onClick={() => dialogo.current?.close()} aria-label="Cerrar"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
      </div>

      <div className="relative my-3 min-h-0 flex-1">
        <div ref={escenario} onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}
          onDoubleClick={e => setVista(v => v.s > 1 ? REPOSO : zoomEn(v, 2.5, e.clientX, e.clientY))}
          className={`absolute inset-0 touch-none select-none overflow-hidden ${vista.s > 1 ? (activo ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'}`}>
          <div className={`absolute inset-0 ${activo ? '' : 'transition-transform duration-300 ease-out motion-reduce:transition-none'}`}
            style={{ transform: `translate3d(${vista.x + desliz}px, ${vista.y}px, 0) scale(${vista.s})` }}>
            <Image key={fotos[indice]} src={fotos[indice]} alt={`${alt} · foto ${indice + 1} de ${fotos.length}`} fill unoptimized sizes="100vw" draggable={false} className="object-contain px-2 sm:px-20" />
          </div>
        </div>
        {varias && <>
          <button type="button" onClick={() => ir(-1)} aria-label="Foto anterior" className={`absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full sm:grid ${vidrioOscuro} hover:bg-white/20`}><Flecha /></button>
          <button type="button" onClick={() => ir(1)} aria-label="Foto siguiente" className={`absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full sm:grid ${vidrioOscuro} hover:bg-white/20`}><Flecha derecha /></button>
        </>}
      </div>

      <div className="flex flex-col items-center gap-3 px-4">
        {varias && <ul className={`flex max-w-full gap-2 overflow-x-auto rounded-2xl p-2 ${vidrioOscuro}`} aria-label="Miniaturas">{fotos.map((url, i) => <li key={url} className="shrink-0">
          <button type="button" onClick={() => { setIndice(i); setVista(REPOSO) }} aria-label={`Ver foto ${i + 1}`} aria-current={i === indice}
            className={`relative block size-14 overflow-hidden rounded-xl transition sm:size-16 ${i === indice ? 'opacity-100 ring-2 ring-white' : 'opacity-55 hover:opacity-90'}`}>
            <Image src={url} alt="" fill unoptimized sizes="64px" className="object-cover" />
          </button>
        </li>)}</ul>}
        <p className="text-center text-xs text-white/65">{varias ? 'Desliza o usa las flechas para cambiar de foto · ' : ''}Doble clic, rueda o pellizca para ampliar</p>
      </div>
    </div>
  </dialog>
}

const IconoPila = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><rect x="3" y="7" width="14" height="14" rx="2.5" /><path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17" /></svg>
const IconoLupa = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" /></svg>
const IconoZoom = ({ menos = false }: { menos?: boolean }) => <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" />{!menos && <path d="M12 5v14" />}</svg>
const Flecha = ({ derecha = false }: { derecha?: boolean }) => <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={derecha ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'} /></svg>
