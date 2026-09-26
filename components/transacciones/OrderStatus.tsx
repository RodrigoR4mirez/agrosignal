import type { EstadoPedido } from '@/lib/transacciones/types'

const colors: Record<EstadoPedido, string> = {
  pendiente: 'bg-amber-50 text-amber-900', confirmado: 'bg-green-50 text-green-900',
  enviado: 'bg-blue-50 text-blue-900', recibido: 'bg-teal-50 text-teal-900',
  calificado: 'bg-green-100 text-green-950', rechazado: 'bg-red-50 text-red-900', cancelado: 'bg-gray-100 text-gray-700',
}
export function OrderStatus({ state }: { state: EstadoPedido }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${colors[state]}`}>{state}</span>
}
