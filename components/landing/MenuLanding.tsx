'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ANCLAS } from './anclas'
import { IconoBrote } from './Iconos'

// Menú fijo: transparente sobre la foto del hero y sólido (blanco) al hacer scroll.
export function MenuLanding({ panel }: { panel: string | null }) {
  const [solido, setSolido] = useState(false)
  useEffect(() => {
    const revisar = () => setSolido(window.scrollY > 24)
    revisar()
    window.addEventListener('scroll', revisar, { passive: true })
    return () => window.removeEventListener('scroll', revisar)
  }, [])
  const cuenta = panel ? <Link href={panel}>Mi panel</Link> : <Link href="/login">Ingresar</Link>
  return <nav aria-label="Navegación principal" className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,padding,color] duration-300 motion-reduce:transition-none ${solido ? 'bg-white/95 py-3 text-petroleo shadow-[0_6px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md lg:py-4' : 'bg-transparent py-7 text-white lg:py-9'}`}>
    <div className="flex items-center justify-between gap-6 px-6 sm:px-10 lg:px-[86px]">
      <Link href="/" translate="no" className={`flex shrink-0 items-center gap-2 font-light tracking-[0.06em] transition-[font-size] duration-300 ${solido ? 'text-2xl text-petroleo sm:text-[28px]' : 'text-2xl sm:text-[34px]'}`}>
        <IconoBrote className={`sm:size-10 size-8 ${solido ? 'text-musgo' : 'text-[#b9d99a]'}`} />AGROSIGNAL
      </Link>
      <ul className="hidden items-center gap-6 whitespace-nowrap text-[15px] xl:flex 2xl:gap-8">{ANCLAS.map(([href, label]) => <li key={href}><a href={href} className={solido ? 'hover:text-naranja' : 'hover:text-trigo'}>{label}</a></li>)}</ul>
      <div className="hidden items-center gap-7 whitespace-nowrap text-[15px] lg:flex">
        <Link href="/marketplace" className="inline-flex min-h-11 items-center rounded-full bg-naranja px-6 font-semibold text-petroleo transition-colors hover:bg-[#f29a5e]">Ver productos</Link>
        <span className="opacity-90 hover:opacity-100">{cuenta}</span>
      </div>
      <details className="relative lg:hidden">
        <summary className={`flex min-h-11 cursor-pointer list-none items-center rounded-full border px-5 text-sm [&::-webkit-details-marker]:hidden ${solido ? 'border-petroleo/30 text-petroleo' : 'border-white/40'}`}>Menú</summary>
        <ul onClick={event => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false }} className="absolute right-0 z-20 mt-3 w-64 space-y-1 rounded-2xl bg-white p-3 text-sm text-gray-800 shadow-xl">
          {ANCLAS.map(([href, label]) => <li key={href}><a href={href} className="block rounded-xl px-3 py-2.5 hover:bg-crema">{label}</a></li>)}
          <li><Link href="/marketplace" className="block rounded-xl bg-naranja px-3 py-2.5 font-semibold text-petroleo">Ver productos</Link></li>
          <li className="[&>a]:block [&>a]:rounded-xl [&>a]:px-3 [&>a]:py-2.5 [&>a:hover]:bg-arena-claro">{cuenta}</li>
        </ul>
      </details>
    </div>
  </nav>
}
