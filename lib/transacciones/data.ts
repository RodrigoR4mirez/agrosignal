import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'
import { uuidPattern } from '@/lib/marketplace/types'
import type { Notificacion, Pedido } from './types'

export const PAGE_SIZE = 12
const pageNumber = (value: number) => Math.max(1, Math.min(10000, Math.floor(Number(value) || 1)))
const orderColumns = 'id,lote_id,comprador_id,productor_id,comprador_nombre,productor_nombre,comprador_telefono,productor_telefono,cultivo,unidad,precio_unidad,cantidad,total,direccion_entrega,estado,calificacion,comentario,motivo,creado_en,actualizado_en'

export async function listOrders(profile: Profile, pagina = 1) {
  const session = await requireRole(['comprador', 'productor'])
  const page = pageNumber(pagina)
  if (session.id !== profile.id || session.rol !== profile.rol) return { orders: [] as Pedido[], error: true, count: 0, page }
  try {
    const db = await createClient()
    const { data, error, count } = await db.from('pedidos').select(orderColumns, { count: 'exact' })
      .eq(profile.rol === 'comprador' ? 'comprador_id' : 'productor_id', profile.id)
      .order('creado_en', { ascending: false }).order('id')
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    return { orders: (data ?? []) as Pedido[], error: Boolean(error), count: count ?? 0, page }
  } catch { return { orders: [] as Pedido[], error: true, count: 0, page } }
}

export async function getOrder(id: string) {
  await requireRole(['comprador', 'productor'])
  if (!uuidPattern.test(id)) return { order: null, error: false }
  try {
    const db = await createClient()
    const { data, error } = await db.from('pedidos').select(orderColumns).eq('id', id).maybeSingle()
    return { order: data as Pedido | null, error: Boolean(error) }
  } catch { return { order: null, error: true } }
}

export async function listNotifications(pagina = 1) {
  const profile = await requireRole()
  const page = pageNumber(pagina)
  try {
    const db = await createClient()
    const [result, unread] = await Promise.all([
      db.from('notificaciones').select('*', { count: 'exact' }).eq('usuario_id', profile.id)
        .order('creado_en', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
      db.from('notificaciones').select('id', { count: 'exact', head: true }).eq('usuario_id', profile.id).eq('leida', false),
    ])
    return { notifications: (result.data ?? []) as Notificacion[], error: Boolean(result.error || unread.error), unread: unread.count ?? 0, count: result.count ?? 0, page }
  } catch { return { notifications: [] as Notificacion[], error: true, unread: 0, count: 0, page } }
}
