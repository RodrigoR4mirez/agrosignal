'use client'

import { useActionState, useState } from 'react'
import { desconectarMercadoPagoAction } from '@/app/pagos/actions'
import { FormMessage } from '@/components/auth/FormFields'

export function DesconectarMercadoPago() {
  const [state, action, pending] = useActionState(desconectarMercadoPagoAction, {})
  const [confirmar, setConfirmar] = useState(false)
  return <div className="space-y-3">
    <FormMessage state={state} />
    {confirmar ? <form action={action} className="flex flex-wrap items-center gap-3"><span className="text-sm text-gray-700">Los compradores ya no podrán pagarte en línea.</span><button disabled={pending} className="min-h-10 rounded-full bg-red-700 px-4 text-sm font-semibold text-white">{pending ? 'Desconectando…' : 'Sí, desconectar'}</button><button type="button" onClick={() => setConfirmar(false)} className="min-h-10 rounded-full px-4 text-sm font-semibold text-petroleo ring-1 ring-petroleo/25">Volver</button></form>
      : <button type="button" onClick={() => setConfirmar(true)} className="text-sm font-semibold text-red-700 underline-offset-4 hover:underline">Desconectar cuenta</button>}
  </div>
}
