import type { Pedido } from './types'

// Seis fases del flujo de compra. Con pago contra entrega, el pago va después de la recepción.
export type Fase = 'solicitud' | 'acuerdo' | 'pago' | 'despacho' | 'recepcion' | 'cierre'
export const NOMBRE_FASE: Record<Fase, string> = { solicitud: 'Solicitud', acuerdo: 'Acuerdo', pago: 'Pago', despacho: 'Despacho', recepcion: 'Recepción', cierre: 'Cierre' }

export function fasesDe(p: Pedido): Fase[] {
  return p.forma_pago === 'contra_entrega'
    ? ['solicitud', 'acuerdo', 'despacho', 'recepcion', 'pago', 'cierre']
    : ['solicitud', 'acuerdo', 'pago', 'despacho', 'recepcion', 'cierre']
}

// Fase en curso; 'completado' cuando ya no queda nada por hacer.
export function faseActual(p: Pedido): Fase | 'completado' | 'terminado' {
  if (p.estado === 'rechazado' || p.estado === 'cancelado') return 'terminado'
  if (p.estado === 'pendiente') return p.propuesta_en ? 'acuerdo' : 'solicitud'
  if (p.estado === 'confirmado') return p.forma_pago === 'antes_envio' && !p.pago_confirmado_en ? 'pago' : 'despacho'
  if (p.estado === 'enviado') return 'recepcion'
  if (!p.pago_confirmado_en) return 'pago'
  return p.comprobante_en ? 'completado' : 'cierre'
}

// Estado en palabras para listas y cabeceras.
export function etiquetaPedido(p: Pedido): { texto: string; tono: 'espera' | 'avance' | 'ok' | 'alerta' | 'neutro' } {
  if (p.flujo !== 2) return { texto: { pendiente: 'Pendiente', confirmado: 'Confirmado', enviado: 'Enviado', recibido: 'Recibido', calificado: 'Recibido', rechazado: 'Rechazado', cancelado: 'Cancelado' }[p.estado], tono: p.estado === 'rechazado' || p.estado === 'cancelado' ? 'neutro' : 'avance' }
  if (p.estado === 'rechazado') return { texto: 'Rechazada', tono: 'neutro' }
  if (p.estado === 'cancelado') return { texto: 'Cancelado', tono: 'neutro' }
  if (p.observacion_en && !p.comprobante_en) return { texto: 'Con observación', tono: 'alerta' }
  if (p.estado === 'pendiente') return p.propuesta_en ? { texto: 'Contrapropuesta', tono: 'espera' } : { texto: 'Solicitud enviada', tono: 'espera' }
  if (p.estado === 'confirmado') return p.pago_confirmado_en ? { texto: 'Pago confirmado', tono: 'avance' } : p.pago_informado_en ? { texto: 'Pago informado', tono: 'espera' } : { texto: 'Acuerdo confirmado', tono: 'avance' }
  if (p.estado === 'enviado') return { texto: 'En camino', tono: 'avance' }
  if (!p.pago_confirmado_en) return p.pago_informado_en ? { texto: 'Pago informado', tono: 'espera' } : { texto: 'Recibido · falta el pago', tono: 'espera' }
  return p.comprobante_en ? { texto: 'Completado', tono: 'ok' } : { texto: 'Recibido', tono: 'avance' }
}

// Qué toca ahora y quién lo hace.
export function siguientePaso(p: Pedido, rol: 'comprador' | 'productor'): { quien: 'yo' | 'otro' | 'nadie'; texto: string } {
  const f = faseActual(p)
  const yo = (r: 'comprador' | 'productor', mio: string, otro: string) => rol === r ? { quien: 'yo' as const, texto: mio } : { quien: 'otro' as const, texto: otro }
  if (f === 'terminado') return { quien: 'nadie', texto: p.estado === 'rechazado' ? 'El productor no aceptó esta solicitud.' : 'Este pedido fue cancelado.' }
  if (f === 'completado') return { quien: 'nadie', texto: 'Compra concluida: pago confirmado, cosecha entregada y comprobante registrado.' }
  if (f === 'solicitud') return yo('productor', 'Revisa la solicitud: acéptala, propón otras condiciones o recházala.', 'Esperando la respuesta del productor.')
  if (f === 'acuerdo') return yo('comprador', 'El productor propuso nuevas condiciones. Acéptalas para cerrar el acuerdo o recházalas.', 'Esperando que el comprador responda a tu propuesta.')
  if (f === 'pago') return p.pago_informado_en
    ? yo('productor', 'El comprador informó el pago. Verifica que llegó a tu cuenta y confírmalo.', 'Esperando que el productor confirme tu pago.')
    : yo('comprador', 'Realiza el pago directamente al productor y adjunta la constancia.', 'Esperando el pago del comprador.')
  if (f === 'despacho') return yo('productor', p.entrega === 'recojo' ? 'Prepara la cosecha y marca el pedido como entregado cuando el comprador la recoja.' : 'Despacha la cosecha y registra la guía de remisión y el transportista.', 'El productor está preparando el despacho.')
  if (f === 'recepcion') return yo('comprador', 'Revisa la cosecha al recibirla y confirma la recepción, o reporta un problema.', 'Esperando que el comprador confirme la recepción.')
  return p.comprobante_tipo === null || p.comprobante_tipo === undefined
    ? { quien: 'yo', texto: rol === 'productor' ? 'Registra la factura o boleta (si el comprador emite una liquidación de compra, la subirá él). Luego califica al comprador.' : 'Si el productor no tiene RUC, registra tu liquidación de compra; si no, espera su factura o boleta. Luego califica al productor.' }
    : { quien: 'nadie', texto: 'Compra concluida.' }
}
