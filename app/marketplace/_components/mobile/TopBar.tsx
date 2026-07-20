'use client'

import { useState } from 'react'
import { MaterialSymbol } from '../shared/MaterialSymbol'

const LINKS = ['Mercados', 'Riesgo', 'Transporte', 'Comunidad']

export function TopBar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-[60] flex w-full items-center justify-between border-b border-[var(--ms-outline-variant)] bg-[var(--ms-surface)] px-6 py-4 shadow-sm">
        <h1 className="text-2xl leading-[32px] font-bold tracking-tight text-[var(--ms-primary)]">AgroSignal</h1>
        <button
          aria-label="Abrir menú"
          className="text-[28px] text-[var(--ms-primary)]"
          onClick={() => setOpen(true)}
        >
          <MaterialSymbol name="menu" />
        </button>
      </header>
      <div
        className={`fixed inset-0 z-[70] flex flex-col bg-[var(--ms-primary)] p-8 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-12 flex justify-end">
          <button aria-label="Cerrar menú" className="text-[32px] text-white" onClick={() => setOpen(false)}>
            <MaterialSymbol name="close" />
          </button>
        </div>
        <nav className="flex flex-col gap-8">
          {LINKS.map((link) => (
            <a key={link} className="text-2xl font-bold text-white" href="#">
              {link}
            </a>
          ))}
        </nav>
        <div className="mt-auto">
          <button className="w-full rounded-[0.75rem] bg-[var(--ms-secondary-container)] py-4 font-bold text-[var(--ms-on-secondary-container)]">
            Iniciar Sesión
          </button>
        </div>
      </div>
    </>
  )
}
