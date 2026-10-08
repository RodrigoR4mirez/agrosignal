import { etiquetaPedido } from '@/lib/transacciones/fases'
import type { Pedido } from '@/lib/transacciones/types'

export const TONOS = {
  espera: 'bg-trigo/25 text-cacao', avance: 'bg-petroleo/[0.08] text-petroleo', ok: 'bg-musgo/15 text-bosque',
  alerta: 'bg-amber-100 text-amber-950', neutro: 'bg-gray-100 text-gray-600',
}
// Estado del pedido en palabras ("Solicitud enviada", "Pago confirmado", "En camino"…).
export function EtiquetaPedido({ order, grande = false }: { order: Pedido; grande?: boolean }) {
  const { texto, tono } = etiquetaPedido(order)
  return <span className={`inline-flex items-center rounded-full font-semibold ${grande ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'} ${TONOS[tono]}`}>{texto}</span>
}
