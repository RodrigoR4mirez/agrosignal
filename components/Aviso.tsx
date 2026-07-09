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
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} px-6 py-6 text-sm ${styles.text} leading-relaxed`}>
      <p><strong>Aviso:</strong> {resumen}</p>
      {abierto && <p className="mt-3 pt-3 border-t border-current/10">{detalle}</p>}
      <button
        onClick={() => setAbierto(v => !v)}
        className={`mt-2 text-sm font-semibold ${styles.link} underline underline-offset-2 transition-colors`}
      >
        {abierto ? 'Ocultar metodología' : 'Ver metodología →'}
      </button>
    </div>
  )
}
