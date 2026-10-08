import type { EstadoPedido } from '@/lib/transacciones/types'
import { TONOS } from './EtiquetaPedido'

// Mismos tonos que EtiquetaPedido para que un estado se vea igual en todo el sitio.
const tono: Record<EstadoPedido, keyof typeof TONOS> = {
  pendiente: 'espera', confirmado: 'avance', enviado: 'avance', recibido: 'ok',
  calificado: 'ok', rechazado: 'alerta', cancelado: 'neutro',
}
export function OrderStatus({ state }: { state: EstadoPedido }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONOS[tono[state]]}`}>{state.charAt(0).toUpperCase() + state.slice(1)}</span>
}
