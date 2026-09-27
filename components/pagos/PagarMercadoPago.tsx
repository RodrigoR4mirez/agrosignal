'use client'

import { useActionState, useEffect } from 'react'
import { pagarConMercadoPagoAction } from '@/app/pagos/actions'
import { money } from '@/lib/marketplace/types'

// Botón de pago en línea: crea el cobro en Mercado Pago y lleva al comprador a su página segura.
export function PagarMercadoPago({ pedidoId, total }: { pedidoId: string; total: number }) {
  const [state, action, pending] = useActionState(pagarConMercadoPagoAction, {})
  useEffect(() => { if (state.url) window.location.assign(state.url) }, [state.url])
  const yendo = pending || Boolean(state.url)
  return <form action={action} className="space-y-3">
    <input type="hidden" name="pedido_id" value={pedidoId} />
    <button disabled={yendo} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#009ee3] px-6 text-[15px] font-semibold text-white transition hover:bg-[#0088c6] disabled:opacity-70 sm:w-auto">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
      {yendo ? 'Abriendo Mercado Pago…' : `Pagar ${money(total)} con Mercado Pago`}
    </button>
    <p className="text-xs leading-relaxed text-gray-500">Pagas en la página segura de Mercado Pago con tarjeta, Yape u otros medios. El dinero va a la cuenta del productor y el pago se confirma solo. AgroSignal no ve los datos de tu tarjeta.</p>
    {state.error && <p role="alert" className="text-sm text-red-800">{state.error}</p>}
  </form>
}
