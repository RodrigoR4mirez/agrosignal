'use client'
import { useState } from 'react'

export default function Aviso({
  resumen,
  detalle,
  tone = 'amber',
}: {
  resumen: string
  detalle: string
  tone?: 'amber' | 'red'
}) {
  const [abierto, setAbierto] = useState(false)

  const styles = tone === 'red'
    ? { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-900', link: 'text-red-700 hover:text-red-800' }
    : { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-900', link: 'text-amber-700 hover:text-amber-800' }

  return (
    <div className={`card-surface border ${styles.border} ${styles.bg} px-6 py-5 text-sm font-normal ${styles.text} leading-relaxed`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-8">
        <p className="min-w-0"><strong className="font-bold">Aviso:</strong> {resumen}</p>
        <button
          onClick={() => setAbierto(v => !v)}
          className={`shrink-0 self-start sm:self-center text-sm font-medium ${styles.link} underline underline-offset-2 whitespace-nowrap`}
          style={{ transition: 'var(--transition-base)' }}
        >
          {abierto ? 'Ocultar metodología' : 'Ver metodología →'}
        </button>
      </div>
      {abierto && <p className="mt-4 pt-4 border-t border-current/10">{detalle}</p>}
    </div>
  )
}
