import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern, type Lote } from '@/lib/marketplace/types'
import { hoyLima, type Certificado, type InspeccionDron, type TestResiduos, type SelloResumen, type SelloManagement } from './types'

/** Public DTO contains status only. Hidden lots are never returned, even to owners. */
export async function getPublicSello(loteId: string): Promise<SelloResumen | null> {
  if (!uuidPattern.test(loteId)) return null
  const db = await createClient()
  const { data: lote, error: loteError } = await db.from('catalogo_lotes').select('id').eq('id', loteId).maybeSingle()
  if (loteError) throw new Error('No pudimos cargar las verificaciones del lote.')
  if (!lote) return null
  const { data, error } = await db.rpc('estado_sello_lote', { p_lote_id: loteId })
  if (error) throw new Error('No pudimos cargar las verificaciones del lote.')
  return data as SelloResumen | null
}

/** RLS plus explicit ownership guard before reading or signing private evidence. */
export async function getSelloManagement(loteId: string): Promise<SelloManagement | null> {
  const profile = await requireRole(['productor', 'admin'])
  if (!uuidPattern.test(loteId)) return null
  const db = await createClient()
  const { data: lote, error: loteError } = await db.from('lotes').select('*').eq('id', loteId).maybeSingle()
  if (loteError) throw new Error('No pudimos cargar el lote. Intenta nuevamente.')
  if (!lote || (profile.rol !== 'admin' && lote.productor_id !== profile.id)) return null
  const [certs, drones, tests, summary] = await Promise.all([
    db.from('certificados').select('*').eq('lote_id', loteId).order('creado_en', { ascending: false }).order('id'),
    db.from('inspecciones_dron').select('*').eq('lote_id', loteId).order('creado_en', { ascending: false }).order('id'),
    db.from('tests_residuos').select('*').eq('lote_id', loteId).order('creado_en', { ascending: false }).order('id'),
    db.rpc('estado_sello_lote', { p_lote_id: loteId }),
  ])
  if (certs.error || drones.error || tests.error || summary.error || !summary.data) throw new Error('No pudimos cargar las verificaciones. Intenta nuevamente.')
  const certificateRows = (certs.data ?? []) as Certificado[]
  const droneRows = (drones.data ?? []) as InspeccionDron[]
  const testRows = (tests.data ?? []) as TestResiduos[]
  async function sign(bucket: string, paths: string[]) {
    const map = new Map<string, string>()
    if (!paths.length) return map
    const { data, error } = await db.storage.from(bucket).createSignedUrls([...new Set(paths)], 600)
    if (error) return map
    for (const entry of data ?? []) if (entry.path && entry.signedUrl && !entry.error) map.set(entry.path, entry.signedUrl)
    return map
  }
  const [certificateUrls, droneUrls, testUrls] = await Promise.all([
    sign('certificados', certificateRows.map(c => c.archivo_url)),
    sign('evidencia-drones', droneRows.flatMap(d => d.evidencia_urls ?? [])),
    sign('evidencia-tests', testRows.map(t => t.foto_evidencia_url)),
  ])
  const today = hoyLima()
  return {
    lote: lote as Lote,
    resumen: summary.data as SelloResumen,
    certificados: certificateRows.map(c => ({ ...c,
      estado_efectivo: c.estado !== 'rechazado' && c.fecha_vencimiento < today ? 'vencido' : c.estado,
      archivo_firmado: certificateUrls.get(c.archivo_url) ?? null,
    })),
    inspecciones: droneRows.map(d => ({ ...d, evidencia_firmada: (d.evidencia_urls ?? []).map(path => ({ path, url: droneUrls.get(path) ?? null })) })),
    tests: testRows.map(t => ({ ...t, foto_firmada: testUrls.get(t.foto_evidencia_url) ?? null })),
  }
}
