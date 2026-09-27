import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import { hoyLima } from '@/lib/sello/types'
import { ESTADOS_PEDIDO } from '@/lib/transacciones/types'
import type { AdminCertificate, AdminDrone, AdminFailedTest, AdminLot, AdminMetrics, AdminOrder, AdminOrderFilters, AdminPage, AdminUser, AdminUserFilters } from './types'

export const ADMIN_PAGE_SIZE = 12
const pageNumber = (value = 1) => Math.max(1, Math.min(10000, Math.floor(Number(value) || 1)))
const userColumns = 'id,nombre_completo,telefono,rol,region,cultivo_principal,tipo_comprador,destino_exportacion,suspendido,creado_en,moderacion_version,moderacion_motivo,moderacion_en,moderacion_por'
const orderColumns = 'id,lote_id,comprador_id,productor_id,comprador_nombre,productor_nombre,comprador_telefono,productor_telefono,cultivo,unidad,precio_unidad,cantidad,total,direccion_entrega,estado,recibido_en,motivo,creado_en,actualizado_en,resolucion,resolucion_accion,resolucion_estado_inicial,resuelto_por,resuelto_en,flujo'
const searchText = (q = '') => q.trim().slice(0, 100).replace(/[\\%_]/g, '\\$&')
const failedPage = <T>(page: number): AdminPage<T> => ({ items: [], count: 0, page, error: true })

export async function listAdminUsers(filters: AdminUserFilters = {}): Promise<AdminPage<AdminUser>> {
  await requireRole('admin')
  const page = pageNumber(filters.page)
  try {
    const db = await createClient()
    let query = db.from('perfiles').select(userColumns, { count: 'exact' }).in('rol', ['productor', 'comprador'])
    if (filters.rol === 'productor' || filters.rol === 'comprador') query = query.eq('rol', filters.rol)
    if (filters.estado === 'activos' || filters.estado === 'suspendidos') query = query.eq('suspendido', filters.estado === 'suspendidos')
    if (searchText(filters.q)) query = query.ilike('nombre_completo', `%${searchText(filters.q)}%`)
    const { data, error, count } = await query.order('creado_en', { ascending: false }).order('id').range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1)
    if (error) return failedPage(page)
    return { items: (data ?? []) as AdminUser[], count: count ?? 0, page, error: false }
  } catch { return failedPage(page) }
}

async function loadLots(db: Awaited<ReturnType<typeof createClient>>, ids: string[]): Promise<Map<string, AdminLot>> {
  const result = new Map<string, AdminLot>()
  if (!ids.length) return result
  const { data: lots, error } = await db.from('lotes').select('id,cultivo,productor_id,region,bloqueado').in('id', [...new Set(ids)])
  if (error || !lots) throw new Error('No pudimos cargar los lotes de esta cola.')
  const { data: users, error: userError } = await db.from('perfiles').select('id,nombre_completo,telefono').in('id', [...new Set(lots.map(l => l.productor_id))])
  if (userError || !users) throw new Error('No pudimos cargar los productores.')
  const profiles = new Map(users.map(p => [p.id, p]))
  for (const lot of lots) result.set(lot.id, { ...lot, productor_nombre: profiles.get(lot.productor_id)?.nombre_completo ?? 'Productor', productor_telefono: profiles.get(lot.productor_id)?.telefono ?? '' } as AdminLot)
  if (ids.some(id => !result.has(id))) throw new Error('No pudimos cargar todos los lotes.')
  return result
}

async function signEvidence(db: Awaited<ReturnType<typeof createClient>>, bucket: string, paths: string[]) {
  const urls = new Map<string, string>()
  if (!paths.length) return urls
  const { data, error } = await db.storage.from(bucket).createSignedUrls([...new Set(paths)], 600)
  if (error) return urls
  for (const entry of data ?? []) if (entry.path && entry.signedUrl && !entry.error) urls.set(entry.path, entry.signedUrl)
  return urls
}

export async function listPendingCertificates(pagina = 1): Promise<AdminPage<AdminCertificate>> {
  await requireRole('admin')
  const page = pageNumber(pagina)
  try {
    const db = await createClient()
    const { data, error, count } = await db.from('certificados').select('*', { count: 'exact' }).eq('estado', 'en_revision')
      .order('creado_en').order('id').range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1)
    if (error) return failedPage(page)
    const rows = data ?? []
    const [lots, urls] = await Promise.all([loadLots(db, rows.map(c => c.lote_id)), signEvidence(db, 'certificados', rows.map(c => c.archivo_url))])
    return { items: rows.map(c => ({ ...c, lote: lots.get(c.lote_id), estado_efectivo: c.fecha_vencimiento < hoyLima() ? 'vencido' : c.estado, archivo_firmado: urls.get(c.archivo_url) ?? null })) as AdminCertificate[], count: count ?? 0, page, error: false }
  } catch { return failedPage(page) }
}

export async function listPendingDrones(pagina = 1): Promise<AdminPage<AdminDrone>> {
  await requireRole('admin')
  const page = pageNumber(pagina)
  try {
    const db = await createClient()
    const { data, error, count } = await db.from('inspecciones_dron').select('*', { count: 'exact' }).eq('estado', 'solicitado')
      .order('creado_en').order('id').range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1)
    if (error) return failedPage(page)
    const rows = data ?? [], lots = await loadLots(db, rows.map(d => d.lote_id))
    return { items: rows.map(d => ({ ...d, lote: lots.get(d.lote_id), evidencia_firmada: [] })) as AdminDrone[], count: count ?? 0, page, error: false }
  } catch { return failedPage(page) }
}

export async function listFailedTests(pagina = 1): Promise<AdminPage<AdminFailedTest>> {
  await requireRole('admin')
  const page = pageNumber(pagina)
  try {
    const db = await createClient()
    const { data, error, count } = await db.from('tests_residuos').select('*', { count: 'exact' }).eq('resultado', 'no_pasa')
      .order('creado_en', { ascending: false }).order('id').range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1)
    if (error) return failedPage(page)
    const rows = data ?? []
    const [lots, urls] = await Promise.all([loadLots(db, rows.map(t => t.lote_id)), signEvidence(db, 'evidencia-tests', rows.map(t => t.foto_evidencia_url))])
    return { items: rows.map(t => ({ ...t, lote: lots.get(t.lote_id), foto_firmada: urls.get(t.foto_evidencia_url) ?? null })) as AdminFailedTest[], count: count ?? 0, page, error: false }
  } catch { return failedPage(page) }
}

export async function listAdminOrders(filters: AdminOrderFilters = {}): Promise<AdminPage<AdminOrder>> {
  await requireRole('admin')
  const page = pageNumber(filters.page)
  try {
    const db = await createClient()
    let query = db.from('pedidos').select(orderColumns, { count: 'exact' })
    if (filters.estado && filters.estado !== 'todos' && ESTADOS_PEDIDO.includes(filters.estado)) query = query.eq('estado', filters.estado)
    const q = filters.q?.trim() ?? ''
    if (uuidPattern.test(q)) query = query.eq('id', q)
    else if (searchText(q)) query = query.ilike('cultivo', `%${searchText(q)}%`)
    const { data, error, count } = await query.order('creado_en', { ascending: false }).order('id').range((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE - 1)
    if (error) return failedPage(page)
    return { items: (data ?? []) as AdminOrder[], count: count ?? 0, page, error: false }
  } catch { return failedPage(page) }
}

export async function getAdminOrder(id: string): Promise<{ order: AdminOrder | null; error: boolean }> {
  await requireRole('admin')
  if (!uuidPattern.test(id)) return { order: null, error: false }
  try {
    const db = await createClient()
    const { data, error } = await db.from('pedidos').select(orderColumns).eq('id', id).maybeSingle()
    return { order: error ? null : data as AdminOrder | null, error: Boolean(error) }
  } catch { return { order: null, error: true } }
}

export async function getAdminMetrics(): Promise<{ metrics: AdminMetrics | null; error: boolean }> {
  await requireRole('admin')
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('metricas_admin')
    return { metrics: error ? null : data as AdminMetrics | null, error: Boolean(error || !data) }
  } catch { return { metrics: null, error: true } }
}
