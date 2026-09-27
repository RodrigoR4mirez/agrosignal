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
