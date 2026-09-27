'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import { ESTADOS_PEDIDO, type EstadoPedido } from '@/lib/transacciones/types'
import type { AdminActionState } from '@/lib/admin/types'

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
function friendlyError(error: { code?: string; message?: string }) {
  if ((error.code === '22023' || error.code === '42501') && error.message && !/permission denied|row.level|schema|function|relation/i.test(error.message)) return error.message
  return 'No pudimos guardar la decisión. Intenta nuevamente con este mismo formulario.'
}
function refreshAdmin(pedidoId?: string) {
  revalidatePath('/admin', 'layout')
  revalidatePath('/marketplace')
  revalidatePath('/marketplace/[id]', 'page')
  revalidatePath('/panel-productor')
  revalidatePath('/panel-productor/mis-lotes')
  revalidatePath('/panel-comprador')
  if (pedidoId) {
    revalidatePath(`/admin/pedidos/${pedidoId}`)
    revalidatePath(`/panel-comprador/pedidos/${pedidoId}`)
    revalidatePath(`/panel-productor/ventas/${pedidoId}`)
  }
}

export async function moderarUsuarioAction(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireRole('admin')
  const usuarioId = text(form, 'usuario_id'), idempotencia = text(form, 'idempotencia')
  const suspendido = text(form, 'suspendido'), version = text(form, 'version_esperada'), motivo = text(form, 'motivo')
  if (!uuidPattern.test(usuarioId) || !uuidPattern.test(idempotencia) || !['true', 'false'].includes(suspendido) || !/^\d{1,9}$/.test(version)) return { error: 'La solicitud no es válida. Actualiza la página para continuar.' }
  if (motivo.length < 3 || motivo.length > 1000) return { error: 'Escribe un motivo de entre 3 y 1000 caracteres.' }
  try {
    const db = await createClient()
    const { error } = await db.rpc('moderar_usuario', { p_usuario_id: usuarioId, p_suspendido: suspendido === 'true', p_motivo: motivo, p_version_esperada: Number(version), p_idempotencia: idempotencia })
    if (error) return { error: friendlyError(error) }
  } catch { return { error: 'No pudimos conectar. Reintenta con este mismo formulario; la decisión no se duplicará.' } }
  refreshAdmin()
  return { success: suspendido === 'true' ? 'Cuenta suspendida. El motivo quedó registrado y sus lotes ya no aparecen en el marketplace.' : 'Cuenta reactivada. Se registró el motivo y se notificó al usuario.' }
}

export async function resolverDisputaAction(_previous: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireRole('admin')
  const pedidoId = text(form, 'pedido_id'), idempotencia = text(form, 'idempotencia')
  const accion = text(form, 'accion'), resolucion = text(form, 'resolucion'), estado = text(form, 'estado_esperado') as EstadoPedido
  if (!uuidPattern.test(pedidoId) || !uuidPattern.test(idempotencia) || !['acuerdo', 'cancelar'].includes(accion) || !ESTADOS_PEDIDO.includes(estado)) return { error: 'La solicitud no es válida. Actualiza el pedido para continuar.' }
  if (resolucion.length < 10 || resolucion.length > 1000) return { error: 'Describe la resolución con entre 10 y 1000 caracteres.' }
  try {
    const db = await createClient()
    const { error } = await db.rpc('resolver_disputa', { p_pedido_id: pedidoId, p_accion: accion, p_resolucion: resolucion, p_estado_esperado: estado, p_idempotencia: idempotencia })
    if (error) return { error: friendlyError(error) }
  } catch { return { error: 'No pudimos conectar. Reintenta con este mismo formulario; la resolución y el stock no se duplicarán.' } }
  refreshAdmin(pedidoId)
  return { success: accion === 'cancelar' ? 'Pedido cancelado y resolución registrada. Ambas partes recibieron una notificación.' : 'Acuerdo registrado. Ambas partes recibieron una notificación y el pedido conserva su estado.' }
}
