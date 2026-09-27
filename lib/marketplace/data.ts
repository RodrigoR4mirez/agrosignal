import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { CALIFICACION_MINIMA, ORDENES, descuento, uuidPattern, type Lote, type LotePublico } from './types'

function ordenar<T extends { order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(query: T, orden?: string) {
  if (orden === 'calificacion') return query.order('productor_promedio', { ascending: false, nullsFirst: false }).order('productor_calificaciones', { ascending: false }).order('creado_en', { ascending: false })
  if (orden === 'precio_asc') return query.order('precio_unidad', { ascending: true }).order('creado_en', { ascending: false })
  if (orden === 'precio_desc') return query.order('precio_unidad', { ascending: false }).order('creado_en', { ascending: false })
  return query.order('creado_en', { ascending: false })
}

export type CatalogOrder = 'recientes' | 'calificacion' | 'precio_asc' | 'precio_desc'
export type Filters = { q?: string; region?: string; cultivo?: string; minimo?: string; maximo?: string; destino?: string; sello?: string; calificacion?: string; ofertas?: string; orden?: string }
export const PAGE_SIZE = 12

type CursorComun = { v: 1; creado: string; id: string }
type CatalogCursor =
  | (CursorComun & { orden: 'recientes' })
  | (CursorComun & { orden: 'precio_asc'; precio: number })
  | (CursorComun & { orden: 'precio_desc'; precio: number })
  | (CursorComun & { orden: 'calificacion'; promedio: number | null; calificaciones: number })

const TIMESTAMP_CURSOR = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/

function ordenValido(orden?: string): CatalogOrder {
  return orden === 'calificacion' || orden === 'precio_asc' || orden === 'precio_desc' ? orden : 'recientes'
}

function cursorValido(valor: unknown): valor is CatalogCursor {
  if (!valor || typeof valor !== 'object') return false
  const cursor = valor as Partial<CatalogCursor>
  if (cursor.v !== 1 || !uuidPattern.test(cursor.id ?? '') || !cursor.creado || !TIMESTAMP_CURSOR.test(cursor.creado) || !Number.isFinite(Date.parse(cursor.creado))) return false
  if (cursor.orden === 'recientes') return true
  if (cursor.orden === 'precio_asc' || cursor.orden === 'precio_desc') return Number.isFinite(cursor.precio) && Number(cursor.precio) >= 0
  return cursor.orden === 'calificacion'
    && (cursor.promedio === null || Number.isFinite(cursor.promedio))
    && Number.isInteger(cursor.calificaciones) && Number(cursor.calificaciones) >= 0
}

export function decodeCatalogCursor(token: string, orden?: string): CatalogCursor | null {
  if (!token || token.length > 600) return null
  try {
    const cursor: unknown = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'))
    return cursorValido(cursor) && cursor.orden === ordenValido(orden) ? cursor : null
  } catch {
    return null
  }
}

function encodeCatalogCursor(lote: LotePublico, orden?: string) {
  const base = { v: 1 as const, orden: ordenValido(orden), creado: lote.creado_en, id: lote.id }
  const cursor: CatalogCursor = base.orden === 'calificacion'
    ? { ...base, orden: 'calificacion', promedio: lote.productor_promedio === null ? null : Number(lote.productor_promedio), calificaciones: Number(lote.productor_calificaciones) }
    : base.orden === 'precio_asc' || base.orden === 'precio_desc'
      ? { ...base, orden: base.orden, precio: Number(lote.precio_unidad) }
      : { ...base, orden: 'recientes' }
  return Buffer.from(JSON.stringify(cursor)).toString('base64url')
}

function filtroCursor(cursor: CatalogCursor) {
  const creado = cursor.creado
  const id = cursor.id
  if (cursor.orden === 'recientes') {
    return `creado_en.lt.${creado},and(creado_en.eq.${creado},id.gt.${id})`
  }
  if (cursor.orden === 'precio_asc') {
    return `precio_unidad.gt.${cursor.precio},and(precio_unidad.eq.${cursor.precio},creado_en.lt.${creado}),and(precio_unidad.eq.${cursor.precio},creado_en.eq.${creado},id.gt.${id})`
  }
  if (cursor.orden === 'precio_desc') {
    return `precio_unidad.lt.${cursor.precio},and(precio_unidad.eq.${cursor.precio},creado_en.lt.${creado}),and(precio_unidad.eq.${cursor.precio},creado_en.eq.${creado},id.gt.${id})`
  }
  if (cursor.promedio === null) {
    return `and(productor_promedio.is.null,productor_calificaciones.lt.${cursor.calificaciones}),and(productor_promedio.is.null,productor_calificaciones.eq.${cursor.calificaciones},creado_en.lt.${creado}),and(productor_promedio.is.null,productor_calificaciones.eq.${cursor.calificaciones},creado_en.eq.${creado},id.gt.${id})`
  }
  return `productor_promedio.lt.${cursor.promedio},productor_promedio.is.null,and(productor_promedio.eq.${cursor.promedio},productor_calificaciones.lt.${cursor.calificaciones}),and(productor_promedio.eq.${cursor.promedio},productor_calificaciones.eq.${cursor.calificaciones},creado_en.lt.${creado}),and(productor_promedio.eq.${cursor.promedio},productor_calificaciones.eq.${cursor.calificaciones},creado_en.eq.${creado},id.gt.${id})`
}

// Deja solo los filtros válidos, con el mismo formato que acepta GET /api/marketplace. La primera
// tanda (servidor) y las siguientes (scroll infinito) usan este resultado, así nunca se desfasan.
export function filtrosEfectivos(filters: Filters): Filters {
  const r: Filters = {}
  const texto = (valor: string | undefined, maximo: number) => valor?.trim().slice(0, maximo) || undefined
  const precio = (valor?: string) => { const n = Number(valor?.trim()); return valor?.trim() && Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? String(n) : undefined }
  r.q = texto(filters.q, 100); r.region = texto(filters.region, 80); r.cultivo = texto(filters.cultivo, 100)
  r.minimo = precio(filters.minimo); r.maximo = precio(filters.maximo)
  if (filters.destino === 'local' || filters.destino === 'exportacion') r.destino = filters.destino
  if (/^[0-3]$/.test(filters.sello ?? '')) r.sello = filters.sello
  if (CALIFICACION_MINIMA.some(([value]) => value === filters.calificacion)) r.calificacion = filters.calificacion
  if (filters.ofertas === '1') r.ofertas = '1'
  if (filters.orden !== 'recientes' && ORDENES.some(([value]) => value === filters.orden)) r.orden = filters.orden
  return Object.fromEntries(Object.entries(r).filter(([, valor]) => valor !== undefined)) as Filters
}

async function consultarPagina(entrada: Filters, cursor?: CatalogCursor, contar = false) {
  const filters = filtrosEfectivos(entrada)
  const db = await createClient()
  let query = db.from('catalogo_lotes').select('*', contar ? { count: 'exact' } : undefined)
  if (filters.q) query = query.ilike('cultivo', `%${filters.q.replace(/[%_\\]/g, '').slice(0, 100)}%`)
  if (filters.region) query = query.eq('region', filters.region.slice(0, 80))
  if (filters.cultivo) query = query.eq('cultivo', filters.cultivo.slice(0, 100))
  if (filters.destino === 'local' || filters.destino === 'exportacion') query = query.eq('destino', filters.destino)
  if (/^[0-3]$/.test(filters.sello ?? '')) query = query.eq('nivel_sello', Number(filters.sello))
  if (CALIFICACION_MINIMA.some(([value]) => value === filters.calificacion)) query = query.gte('productor_promedio', Number(filters.calificacion))
  if (filters.ofertas === '1') query = query.not('precio_anterior', 'is', null)
  if (filters.minimo) query = query.gte('precio_unidad', Number(filters.minimo))
  if (filters.maximo) query = query.lte('precio_unidad', Number(filters.maximo))
  if (cursor) query = query.or(filtroCursor(cursor))
  const { data, count, error } = await ordenar(query, filters.orden).order('id').limit(PAGE_SIZE + 1)
  const rows = (data ?? []) as LotePublico[]
  const hayMas = rows.length > PAGE_SIZE
  const lots = hayMas ? rows.slice(0, PAGE_SIZE) : rows
  return {
    lots,
    count: count ?? 0,
    nextCursor: hayMas && lots.length ? encodeCatalogCursor(lots[lots.length - 1], filters.orden) : null,
    error,
  }
}
// Cultivos con más lotes publicados (agrupados por la primera palabra: "Arándano Biloxi" → Arándano),
// para los accesos rápidos del catálogo.
function masPublicados(cultivos: string[], limite = 8) {
  const conteo = new Map<string, number>()
  for (const cultivo of cultivos) { const base = cultivo.trim().split(/\s+/)[0]; if (base) conteo.set(base, (conteo.get(base) ?? 0) + 1) }
  return [...conteo].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es')).slice(0, limite)
}
export async function getCatalog(filters: Filters) {
  const db = await createClient()
  const [page, options, rebajas] = await Promise.all([
    consultarPagina(filters, undefined, true),
    db.from('catalogo_lotes').select('cultivo,region').order('cultivo').limit(1000),
    db.from('catalogo_lotes').select('precio_unidad,precio_anterior,fotos').not('precio_anterior', 'is', null).limit(500),
  ])
  // Resumen para el banner de ofertas: cuántos lotes tienen descuento, el mayor y una foto.
  const conRebaja = (rebajas.data ?? []).map(lote => ({ rebaja: descuento(lote as Pick<Lote, 'precio_unidad' | 'precio_anterior'>) ?? 0, foto: (lote.fotos as string[])[0] ?? '' })).filter(lote => lote.rebaja > 0).sort((a, b) => b.rebaja - a.rebaja)
  const ofertas = { total: conRebaja.length, maxima: conRebaja[0]?.rebaja ?? 0, foto: conRebaja[0]?.foto ?? '' }
  return { lots: page.lots, count: page.count, nextCursor: page.nextCursor, error: Boolean(page.error || options.error), crops: [...new Set((options.data ?? []).map(x => x.cultivo as string))], popular: masPublicados((options.data ?? []).map(x => x.cultivo as string)), ofertas }
}

export async function getCatalogPage(filters: Filters, cursor: CatalogCursor) {
  const page = await consultarPagina(filters, cursor)
  if (page.error) throw new Error('No pudimos cargar más productos. Intenta nuevamente.')
  return { lots: page.lots, nextCursor: page.nextCursor }
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
