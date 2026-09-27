'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { seguirProductorAction } from '@/app/panel-comprador/actions'

const corazon = (lleno: boolean) => <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill={lleno ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.5 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>

// Seguir a un productor: el comprador recibe avisos cuando publica o baja un precio.
// Sin sesión lleva a ingresar; para productores y admins no se muestra.
export function BotonSeguir({ productorId, siguiendo, modo, tono = 'claro' }: { productorId: string; siguiendo: boolean; modo: 'comprador' | 'anonimo' | 'oculto'; tono?: 'claro' | 'oscuro' }) {
  const [state, action, pending] = useActionState(seguirProductorAction, { siguiendo })
  if (modo === 'oculto') return null
  const activo = state.siguiendo ?? siguiendo
  const base = `inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tono === 'oscuro' ? 'focus-visible:outline-white' : 'focus-visible:outline-petroleo'}`
  const estilo = activo
    ? (tono === 'oscuro' ? 'bg-white text-petroleo hover:bg-crema' : 'bg-petroleo text-white hover:bg-bosque-claro')
    : (tono === 'oscuro' ? 'bg-white/12 text-white ring-1 ring-white/40 hover:bg-white/20' : 'text-petroleo ring-1 ring-petroleo/30 hover:bg-crema')
  if (modo === 'anonimo') return <Link href={`/login?next=${encodeURIComponent(`/marketplace/productor/${productorId}`)}`} className={`${base} ${estilo}`}>{corazon(false)}Seguir</Link>
  return <form action={action} className="inline-flex flex-col items-start gap-1">
    <input type="hidden" name="productor_id" value={productorId} /><input type="hidden" name="seguir" value={activo ? '0' : '1'} />
    <button disabled={pending} aria-pressed={activo} title={activo ? 'Dejar de seguir' : 'Recibe avisos de sus nuevos lotes y rebajas'} className={`${base} ${estilo} disabled:opacity-60`}>{corazon(activo)}{activo ? 'Siguiendo' : 'Seguir'}</button>
    {state.error && <span role="alert" className={`text-xs ${tono === 'oscuro' ? 'text-trigo' : 'text-red-700'}`}>{state.error}</span>}
  </form>
}
