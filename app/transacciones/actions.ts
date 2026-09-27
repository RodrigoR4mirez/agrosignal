'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import { ESTADOS_PEDIDO, type EstadoPedido, type PedidoActionState } from '@/lib/transacciones/types'
import type { CalificacionActionState } from '@/lib/calificaciones/types'

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()

// Only domain messages deliberately raised by our RPCs may reach the browser.
function friendlyError(error: { code?: string; message?: string }) {
  if ((error.code === '22023' || error.code === '42501') && error.message && !/permission denied|row.level|schema|function|relation/i.test(error.message)) return error.message
  return 'No pudimos guardar el cambio. Intenta nuevamente; tu solicitud no se duplicará.'
}

function refreshOrders(pedidoId?: string) {
  for (const path of ['/panel-comprador', '/panel-productor', '/panel-productor/mis-lotes', '/marketplace']) revalidatePath(path)
  revalidatePath('/marketplace/[id]', 'page')
  revalidatePath('/panel-comprador/comprar/[id]', 'page')
  if (pedidoId) {
    revalidatePath(`/panel-comprador/pedidos/${pedidoId}`)
    revalidatePath(`/panel-productor/ventas/${pedidoId}`)
  }
}

export async function crearPedidoAction(_previous: PedidoActionState, form: FormData): Promise<PedidoActionState> {
  await requireRole('comprador')
  const loteId = text(form, 'lote_id')
  const idempotencia = text(form, 'idempotencia')
  const cantidad = text(form, 'cantidad')
  const precio = text(form, 'precio_esperado')
  const direccion = text(form, 'direccion_entrega')
  if (!uuidPattern.test(loteId) || !uuidPattern.test(idempotencia)) return { error: 'La solicitud no es válida. Actualiza la página para volver a intentarlo.' }
  if (!/^\d{1,11}(\.\d{1,3})?$/.test(cantidad) || Number(cantidad) <= 0) return { error: 'Indica una cantidad mayor que cero, con hasta 3 decimales.' }
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(precio) || Number(precio) <= 0) return { error: 'Actualiza la página para consultar el precio del lote.' }
  if (direccion.length < 8 || direccion.length > 500) return { error: 'Escribe una dirección de entrega de entre 8 y 500 caracteres.' }
  let pedidoId: string
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('crear_pedido', { p_lote_id: loteId, p_cantidad: cantidad, p_direccion_entrega: direccion, p_idempotencia: idempotencia, p_precio_esperado: precio })
    if (error) return { error: friendlyError(error) }
    if (typeof data !== 'string' || !uuidPattern.test(data)) return { error: 'No pudimos confirmar la solicitud. Reintenta con este mismo formulario.' }
    pedidoId = data
  } catch { return { error: 'No pudimos conectar. Reintenta con este mismo formulario; tu pedido no se duplicará.' } }
  refreshOrders(pedidoId)
  return { success: 'Tu pedido está pendiente de aceptación por el productor.', pedidoId }
}

export async function cambiarEstadoPedidoAction(_previous: PedidoActionState, form: FormData): Promise<PedidoActionState> {
  const profile = await requireRole(['comprador', 'productor'])
  const pedidoId = text(form, 'pedido_id')
  const estado = text(form, 'estado') as EstadoPedido
  const motivo = text(form, 'motivo') || null
  if (!uuidPattern.test(pedidoId) || !ESTADOS_PEDIDO.includes(estado) || estado === 'pendiente') return { error: 'El cambio solicitado no es válido.' }
  const allowed = profile.rol === 'productor' ? ['confirmado', 'rechazado', 'enviado', 'cancelado'] : ['recibido', 'cancelado']
  if (!allowed.includes(estado)) return { error: 'No tienes permiso para realizar este cambio.' }
  if (['rechazado', 'cancelado'].includes(estado) && (!motivo || motivo.length < 3 || motivo.length > 1000)) return { error: 'Indica un motivo de entre 3 y 1000 caracteres.' }
  try {
    const db = await createClient()
    const { error } = await db.rpc('cambiar_estado_pedido', { p_pedido_id: pedidoId, p_estado: estado, p_motivo: motivo })
    if (error) return { error: friendlyError(error) }
  } catch { return { error: 'No pudimos conectar. Reintenta el cambio; el stock no se descontará dos veces.' } }
  refreshOrders(pedidoId)
  return { success: `Pedido ${estado}. Ambas partes recibieron una notificación.`, pedidoId }
}

export async function calificarPedidoAction(_previous: CalificacionActionState, form: FormData): Promise<CalificacionActionState> {
  const profile = await requireRole(['comprador', 'productor'])
  const pedidoId = text(form, 'pedido_id')
  const estrellas = text(form, 'estrellas')
  const comentario = text(form, 'comentario') || null
  if (!uuidPattern.test(pedidoId)) return { error: 'La solicitud no es válida. Actualiza la página para volver a intentarlo.' }
  if (!/^[1-5]$/.test(estrellas)) return { error: 'Elige de 1 a 5 estrellas.' }
  if ((comentario?.length ?? 0) > 1000) return { error: 'El comentario puede tener hasta 1000 caracteres.' }
  let revelada = false
  try {
    const db = await createClient()
    const { error } = await db.rpc('calificar_pedido', { p_pedido_id: pedidoId, p_estrellas: Number(estrellas), p_comentario: comentario })
    if (error) return { error: friendlyError(error) }
    const { data } = await db.rpc('estado_calificacion_pedido', { p_pedido_id: pedidoId })
    revelada = Boolean(data?.otra)
  } catch { return { error: 'No pudimos conectar. Reintenta: tu calificación no se guardará dos veces.' } }
  refreshOrders(pedidoId)
  revalidatePath('/marketplace/productor/[id]', 'page')
  return { success: profile.rol === 'comprador' ? 'comprador' : 'productor', revelada }
}

export async function marcarNotificacionAction(_previous: PedidoActionState, form: FormData): Promise<PedidoActionState> {
  await requireRole()
  const id = text(form, 'notificacion_id')
  if (!uuidPattern.test(id)) return { error: 'Esta notificación no es válida.' }
  try {
    const db = await createClient()
    const { error } = await db.rpc('marcar_notificacion_leida', { p_notificacion_id: id })
    if (error) return { error: friendlyError(error) }
  } catch { return { error: 'No pudimos marcar la notificación. Intenta nuevamente.' } }
  revalidatePath('/panel-comprador')
  revalidatePath('/panel-productor')
  revalidatePath('/admin')
  return { success: 'Notificación marcada como leída.' }
}

const fechaValida = (valor: string) => !valor || /^\d{4}-\d{2}-\d{2}$/.test(valor)
const rutaDocumento = (pedidoId: string, ruta: string) => new RegExp(`^${pedidoId}/[0-9a-f-]{36}\\.(pdf|jpg|jpeg|png|webp)$`).test(ruta)

// Fase 1: solicitud de compra con entrega, fecha deseada, forma de pago y mensaje al productor.
export async function solicitarCompraAction(_previous: PedidoActionState, form: FormData): Promise<PedidoActionState> {
  await requireRole('comprador')
  const loteId = text(form, 'lote_id'), idempotencia = text(form, 'idempotencia'), cantidad = text(form, 'cantidad'), precio = text(form, 'precio_esperado')
  const entrega = text(form, 'entrega'), fecha = text(form, 'fecha_entrega'), forma = text(form, 'forma_pago'), mensaje = text(form, 'mensaje')
  const direccion = entrega === 'recojo' ? 'Recojo en la chacra del productor' : text(form, 'direccion_entrega')
  if (!uuidPattern.test(loteId) || !uuidPattern.test(idempotencia)) return { error: 'La solicitud no es válida. Actualiza la página para volver a intentarlo.' }
  if (!/^\d{1,11}(\.\d{1,3})?$/.test(cantidad) || Number(cantidad) <= 0) return { error: 'Indica una cantidad mayor que cero, con hasta 3 decimales.' }
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(precio) || Number(precio) <= 0) return { error: 'Actualiza la página para consultar el precio del lote.' }
  if (entrega !== 'envio' && entrega !== 'recojo') return { error: 'Elige si recibes la cosecha o la recoges.' }
  if (direccion.length < 8 || direccion.length > 500) return { error: 'Escribe una dirección de entrega de entre 8 y 500 caracteres.' }
  if (!fechaValida(fecha)) return { error: 'Revisa la fecha de entrega.' }
  if (forma !== 'antes_envio' && forma !== 'contra_entrega') return { error: 'Elige cuándo pagarás.' }
  if (mensaje.length > 1000) return { error: 'El mensaje puede tener hasta 1000 caracteres.' }
  let pedidoId: string
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('solicitar_compra', { p_lote_id: loteId, p_cantidad: cantidad, p_direccion_entrega: direccion, p_idempotencia: idempotencia, p_precio_esperado: precio, p_entrega: entrega, p_fecha_entrega: fecha || null, p_forma_pago: forma, p_mensaje: mensaje || null })
    if (error) return { error: friendlyError(error) }
    if (typeof data !== 'string' || !uuidPattern.test(data)) return { error: 'No pudimos confirmar la solicitud. Reintenta con este mismo formulario.' }
    pedidoId = data
  } catch { return { error: 'No pudimos conectar. Reintenta con este mismo formulario; tu solicitud no se duplicará.' } }
  refreshOrders(pedidoId)
  return { success: 'Tu solicitud fue enviada al productor.', pedidoId }
}

// Fases 2 a 6: cada botón del pedido envía "accion" y sus datos.
export async function pasoPedidoAction(_previous: PedidoActionState, form: FormData): Promise<PedidoActionState> {
  const profile = await requireRole(['comprador', 'productor'])
  const pedidoId = text(form, 'pedido_id'), accion = text(form, 'accion')
  if (!uuidPattern.test(pedidoId)) return { error: 'El pedido no es válido.' }
  const soloPara = (rol: 'comprador' | 'productor') => profile.rol === rol
  let rpc: string, args: Record<string, unknown>, exito: string
  if (accion === 'proponer' && soloPara('productor')) {
    const precio = text(form, 'precio'), cantidad = text(form, 'cantidad'), fecha = text(form, 'fecha_entrega'), forma = text(form, 'forma_pago'), nota = text(form, 'nota')
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(precio) || Number(precio) <= 0) return { error: 'Indica un precio mayor que cero, con hasta 2 decimales.' }
    if (!/^\d{1,11}(\.\d{1,3})?$/.test(cantidad) || Number(cantidad) <= 0) return { error: 'Indica una cantidad mayor que cero.' }
    if (!fechaValida(fecha) || (forma !== 'antes_envio' && forma !== 'contra_entrega') || nota.length > 500) return { error: 'Revisa la fecha, la forma de pago y la nota.' }
    rpc = 'proponer_condiciones'; args = { p_precio: precio, p_cantidad: cantidad, p_fecha_entrega: fecha || null, p_forma_pago: forma, p_nota: nota || null }; exito = 'Propuesta enviada al comprador.'
  } else if (accion === 'responder' && soloPara('comprador')) {
    const aceptar = text(form, 'aceptar') === '1'
    rpc = 'responder_propuesta'; args = { p_aceptar: aceptar }; exito = aceptar ? 'Acuerdo confirmado.' : 'Propuesta rechazada.'
  } else if (accion === 'informar_pago' && soloPara('comprador')) {
    const metodo = text(form, 'metodo'), operacion = text(form, 'operacion'), voucher = text(form, 'voucher')
    if (!['transferencia', 'yape_plin', 'efectivo'].includes(metodo)) return { error: 'Elige el método de pago.' }
    if (operacion.length > 60 || (voucher && !rutaDocumento(pedidoId, voucher)) || (metodo !== 'efectivo' && !voucher)) return { error: 'Adjunta la constancia del pago (PDF o imagen).' }
    rpc = 'informar_pago'; args = { p_metodo: metodo, p_operacion: operacion || null, p_voucher: voucher || null }; exito = 'Pago informado. El productor recibió un aviso.'
  } else if (accion === 'confirmar_pago' && soloPara('productor')) {
    rpc = 'confirmar_pago'; args = {}; exito = 'Pago confirmado.'
  } else if (accion === 'despachar' && soloPara('productor')) {
    const guia = text(form, 'guia'), transportista = text(form, 'transportista')
    if (guia.length > 40 || transportista.length > 120) return { error: 'Revisa la guía de remisión y el transportista.' }
    rpc = 'registrar_despacho'; args = { p_guia: guia || null, p_transportista: transportista || null }; exito = 'Pedido marcado como enviado.'
  } else if (accion === 'observacion' && soloPara('comprador')) {
    const detalle = text(form, 'detalle')
    if (detalle.length < 10 || detalle.length > 1000) return { error: 'Describe el problema en 10 a 1000 caracteres.' }
    rpc = 'reportar_observacion'; args = { p_detalle: detalle }; exito = 'Recibimos tu reporte. La administración lo revisará con ambas partes.'
  } else if (accion === 'comprobante') {
    const tipo = text(form, 'tipo'), numero = text(form, 'numero').toUpperCase(), archivo = text(form, 'archivo')
    const permitido = tipo === 'liquidacion_compra' ? soloPara('comprador') : (tipo === 'factura' || tipo === 'boleta') && soloPara('productor')
    if (!permitido) return { error: 'No te corresponde registrar este comprobante.' }
    if (!/^[A-Z0-9]{1,4}-\d{1,8}$/.test(numero) || !rutaDocumento(pedidoId, archivo)) return { error: 'Indica la serie y el número (por ejemplo F001-245) y adjunta el comprobante.' }
    rpc = 'registrar_comprobante'; args = { p_tipo: tipo, p_numero: numero, p_archivo: archivo }; exito = 'Comprobante registrado.'
  } else return { error: 'No tienes permiso para realizar este cambio.' }
  try {
    const db = await createClient()
    const { error } = await db.rpc(rpc, { p_pedido_id: pedidoId, ...args })
    if (error) return { error: friendlyError(error) }
  } catch { return { error: 'No pudimos conectar. Reintenta: el cambio no se aplicará dos veces.' } }
  refreshOrders(pedidoId)
  return { success: exito, pedidoId }
}
