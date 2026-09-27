import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { CALIFICACION_MINIMA, type Lote, type LotePublico } from './types'

export type Filters = { q?: string; region?: string; cultivo?: string; minimo?: string; maximo?: string; destino?: string; sello?: string; calificacion?: string; pagina?: string }
export const PAGE_SIZE = 12
export async function getCatalog(filters: Filters) {
  const db = await createClient()
  const page = Math.max(1, Math.min(10000, Math.floor(Number(filters.pagina) || 1)))
  let query = db.from('catalogo_lotes').select('*', { count: 'exact' })
  if (filters.q) query = query.ilike('cultivo', `%${filters.q.replace(/[%_\\]/g, '').slice(0, 100)}%`)
  if (filters.region) query = query.eq('region', filters.region.slice(0, 80))
  if (filters.cultivo) query = query.eq('cultivo', filters.cultivo.slice(0, 100))
  if (filters.destino === 'local' || filters.destino === 'exportacion') query = query.eq('destino', filters.destino)
  if (/^[0-3]$/.test(filters.sello ?? '')) query = query.eq('nivel_sello', Number(filters.sello))
  // Solo productores con promedio publicado (3+ calificaciones) pasan este filtro.
  if (CALIFICACION_MINIMA.some(([value]) => value === filters.calificacion)) query = query.gte('productor_promedio', Number(filters.calificacion))
  if (filters.minimo && Number.isFinite(Number(filters.minimo)) && Number(filters.minimo) >= 0) query = query.gte('precio_unidad', Number(filters.minimo))
  if (filters.maximo && Number.isFinite(Number(filters.maximo)) && Number(filters.maximo) >= 0) query = query.lte('precio_unidad', Number(filters.maximo))
  const [{ data, count, error }, options] = await Promise.all([
    query.order('creado_en', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    db.from('catalogo_lotes').select('cultivo,region').order('cultivo').limit(1000),
  ])
  return { lots: (data ?? []) as LotePublico[], count: count ?? 0, page, error: Boolean(error || options.error), crops: [...new Set((options.data ?? []).map(x => x.cultivo as string))] }
}
export async function getPublicLot(id: string) {
  const db = await createClient()
  const { data, error } = await db.from('catalogo_lotes').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error('No se pudo cargar el lote. Intenta nuevamente.')
  return data as LotePublico | null
}
export async function getOwnLots(owner: string) {
  const db = await createClient()
  const { data, error } = await db.from('lotes').select('*').eq('productor_id', owner).order('creado_en', { ascending: false })
  return { lots: (data ?? []) as Lote[], error: Boolean(error) }
}
export async function getProducerLots(productorId: string) {
  const db = await createClient()
  const { data, error } = await db.from('catalogo_lotes').select('*').eq('productor_id', productorId).order('creado_en', { ascending: false }).limit(24)
  return { lots: (data ?? []) as LotePublico[], error: Boolean(error) }
}
