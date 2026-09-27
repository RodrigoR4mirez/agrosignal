'use client'

import { useActionState } from 'react'
import { marcarMensajeAction } from '@/app/contacto/actions'

export function MarcarMensaje({ id, atendido }: { id: string; atendido: boolean }) {
  const [state, action, pending] = useActionState(marcarMensajeAction, {})
  return <form action={action} className="flex items-center gap-3">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="atendido" value={atendido ? '0' : '1'} />
    <button disabled={pending} className="min-h-10 rounded-full border border-petroleo/25 px-4 text-sm font-semibold text-petroleo hover:bg-crema disabled:opacity-60">{atendido ? 'Marcar como pendiente' : 'Marcar como atendido'}</button>
    {state.error && <span role="alert" className="text-sm text-red-800">{state.error}</span>}
  </form>
}
