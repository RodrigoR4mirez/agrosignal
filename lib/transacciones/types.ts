export const ESTADOS_PEDIDO = ['pendiente', 'confirmado', 'enviado', 'recibido', 'calificado', 'rechazado', 'cancelado'] as const
export type EstadoPedido = typeof ESTADOS_PEDIDO[number]

export type Pedido = {
  id: string
  lote_id: string
  comprador_id: string
  productor_id: string
  comprador_nombre: string
  productor_nombre: string
  comprador_telefono: string
  productor_telefono: string
  cultivo: string
  unidad: 'kg' | 'ton'
  precio_unidad: number
  cantidad: number
  total: number
  direccion_entrega: string
  estado: EstadoPedido
  calificacion: number | null
  comentario: string | null
  motivo: string | null
  creado_en: string
  actualizado_en: string
  resolucion?: string | null
  resolucion_accion?: 'acuerdo' | 'cancelar' | null
  resuelto_en?: string | null
}

export type Notificacion = {
  id: string
  usuario_id: string
  mensaje: string
  leida: boolean
  referencia_tipo: string
  referencia_id: string
  creado_en: string
}

export type PedidoActionState = { error?: string; success?: string; pedidoId?: string }
