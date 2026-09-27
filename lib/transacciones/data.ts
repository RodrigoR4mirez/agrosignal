import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'
import { uuidPattern } from '@/lib/marketplace/types'
import type { EventoPedido, Notificacion, Pedido } from './types'

export const PAGE_SIZE = 12
const pageNumber = (value: number) => Math.max(1, Math.min(10000, Math.floor(Number(value) || 1)))
const orderColumns = 'id,lote_id,comprador_id,productor_id,comprador_nombre,productor_nombre,comprador_telefono,productor_telefono,cultivo,unidad,precio_unidad,cantidad,total,direccion_entrega,estado,recibido_en,motivo,creado_en,actualizado_en,resolucion,resolucion_accion,resuelto_en,flujo,entrega,fecha_entrega,forma_pago,mensaje,propuesta_precio,propuesta_cantidad,propuesta_fecha,propuesta_forma_pago,propuesta_nota,propuesta_en,acordado_en,pago_metodo,pago_operacion,pago_voucher,pago_informado_en,pago_confirmado_en,guia_remision,transportista,enviado_en,observacion,observacion_en,comprobante_tipo,comprobante_numero,comprobante_archivo,comprobante_en'

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

export type DocumentosPedido = { voucher: string | null; comprobante: string | null }
const sinDocumentos: DocumentosPedido = { voucher: null, comprobante: null }

// Pedido con su historial y enlaces temporales (10 min) a los documentos privados.
// La base de datos solo lo entrega a las partes y a la administración.
export async function getOrder(id: string, roles: ('comprador' | 'productor' | 'admin')[] = ['comprador', 'productor']) {
  await requireRole(roles)
  if (!uuidPattern.test(id)) return { order: null, eventos: [] as EventoPedido[], documentos: sinDocumentos, error: false }
  try {
    const db = await createClient()
    const [{ data, error }, eventos] = await Promise.all([
      db.from('pedidos').select(orderColumns).eq('id', id).maybeSingle(),
      db.from('pedido_eventos').select('id,tipo,actor_id,detalle,creado_en').eq('pedido_id', id).order('creado_en').order('id'),
    ])
    const order = data as Pedido | null
    const firmar = async (ruta?: string | null) => ruta ? (await db.storage.from('documentos-pedido').createSignedUrl(ruta, 600)).data?.signedUrl ?? null : null
    const [voucher, comprobante] = order ? await Promise.all([firmar(order.pago_voucher), firmar(order.comprobante_archivo)]) : [null, null]
    return { order, eventos: (eventos.data ?? []) as EventoPedido[], documentos: { voucher, comprobante }, error: Boolean(error) }
  } catch { return { order: null, eventos: [] as EventoPedido[], documentos: sinDocumentos, error: true } }
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
