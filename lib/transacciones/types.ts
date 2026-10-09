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
  recibido_en: string | null
  motivo: string | null
  creado_en: string
  actualizado_en: string
  resolucion?: string | null
  resolucion_accion?: 'acuerdo' | 'cancelar' | null
  resuelto_en?: string | null
  // Flujo de compra (flujo 2). Los pedidos antiguos tienen flujo 1 y estos campos vacíos.
  flujo?: 1 | 2
  entrega?: 'envio' | 'recojo'
  fecha_entrega?: string | null
  forma_pago?: FormaPago
  mensaje?: string | null
  propuesta_precio?: number | null
  propuesta_cantidad?: number | null
  propuesta_fecha?: string | null
  propuesta_forma_pago?: FormaPago | null
  propuesta_nota?: string | null
  propuesta_en?: string | null
  acordado_en?: string | null
  pago_metodo?: MetodoPago | null
  pago_operacion?: string | null
  pago_voucher?: string | null
  pago_informado_en?: string | null
  pago_confirmado_en?: string | null
  guia_remision?: string | null
  transportista?: string | null
  enviado_en?: string | null
  observacion?: string | null
  observacion_en?: string | null
  comprobante_tipo?: TipoComprobante | null
  comprobante_numero?: string | null
  comprobante_archivo?: string | null
  comprobante_en?: string | null
  devolucion_estado?: EstadoDevolucion | null
  devolucion_motivo?: MotivoDevolucion | null
  devolucion_detalle?: string | null
  devolucion_cantidad?: number | null
  devolucion_monto?: number | null
  devolucion_respuesta?: string | null
  devolucion_solicitada_en?: string | null
  devolucion_respondida_en?: string | null
  devolucion_completada_en?: string | null
  devolucion_revision?: string | null
  devolucion_revisada_en?: string | null
}
export type FormaPago = 'antes_envio' | 'contra_entrega'
export type MetodoPago = 'transferencia' | 'yape_plin' | 'efectivo' | 'mercado_pago'
export type TipoComprobante = 'factura' | 'boleta' | 'liquidacion_compra'
export type EventoPedido = { id: number; tipo: string; actor_id: string | null; detalle: string | null; creado_en: string }
export const FORMAS_PAGO: Record<FormaPago, [string, string]> = {
  antes_envio: ['Pago antes del envío', 'Pagas al cerrar el acuerdo y el productor despacha al confirmar el pago.'],
  contra_entrega: ['Pago contra entrega', 'Pagas al recibir la cosecha conforme.'],
}
export const METODOS_PAGO: Record<MetodoPago, string> = { transferencia: 'Transferencia bancaria', yape_plin: 'Yape o Plin', efectivo: 'Efectivo', mercado_pago: 'Mercado Pago' }
// Devoluciones: plazo desde la recepción (debe coincidir con private.cierre_devolucion).
export const PLAZO_DEVOLUCION_DIAS = 7
export type EstadoDevolucion = 'solicitada' | 'aceptada' | 'rechazada' | 'completada'
export type MotivoDevolucion = 'defecto' | 'arrepentimiento'
export const MOTIVOS_DEVOLUCION: Record<MotivoDevolucion, [string, string]> = {
  defecto: ['Llegó con defecto', 'Dañada, en mal estado o distinta a lo acordado. El productor paga el flete de la devolución.'],
  arrepentimiento: ['Ya no la necesito', 'La cosecha llegó conforme. Tú pagas el flete de la devolución.'],
}
export const ESTADOS_DEVOLUCION: Record<EstadoDevolucion, string> = { solicitada: 'Devolución solicitada', aceptada: 'Devolución aceptada', rechazada: 'Devolución rechazada', completada: 'Devolución completada' }
/** Fecha límite para pedir la devolución, o null si el pedido aún no se recibe. */
export function cierreDevolucion(p: Pick<Pedido, 'recibido_en'>) {
  return p.recibido_en ? new Date(new Date(p.recibido_en).getTime() + PLAZO_DEVOLUCION_DIAS * 86_400_000) : null
}
export const COMPROBANTES: Record<TipoComprobante, string> = { factura: 'Factura electrónica', boleta: 'Boleta de venta', liquidacion_compra: 'Liquidación de compra' }

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
