'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import type { SelloActionState } from '@/lib/sello/types'

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const dateValid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date
const evidencePath = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpe?g|png|webp|mp4)$/
function friendlyError(error: { code?: string; message?: string }) {
  if (['22023', '42501'].includes(error.code ?? '') && error.message && !/permission denied|row.level|schema|function|relation/i.test(error.message)) return error.message
  return 'No pudimos guardar la verificación. Revisa los datos e intenta nuevamente.'
}
function refresh(loteId: string) {
  revalidatePath('/admin', 'layout')
  for (const path of [`/verificaciones/${loteId}`, `/marketplace/${loteId}`, '/marketplace', '/panel-productor/mis-lotes', '/panel-productor', '/panel-comprador', '/admin']) revalidatePath(path)
}
async function mutate(loteId: string, rpc: string, args: Record<string, unknown>, success: string): Promise<SelloActionState> {
  try {
    const db = await createClient()
    const { error } = await db.rpc(rpc, args)
    if (error) return { error: friendlyError(error) }
  } catch { return { error: 'No pudimos conectar. Reintenta con el mismo formulario; el registro no se duplicará.' } }
  refresh(loteId)
  return { success }
}
async function belongsToLot(table: 'certificados' | 'inspecciones_dron', id: string, loteId: string) {
  try {
    const db = await createClient()
    const { data, error } = await db.from(table).select('id').eq('id', id).eq('lote_id', loteId).maybeSingle()
    return !error && Boolean(data)
  } catch { return false }
}

export async function subirCertificado(_previous: SelloActionState, form: FormData): Promise<SelloActionState> {
  await requireRole('productor')
  const loteId = text(form, 'lote_id'), tipo = text(form, 'tipo'), numero = text(form, 'numero')
  const date = text(form, 'fecha_vencimiento'), path = text(form, 'archivo_path')
  if (!uuidPattern.test(loteId) || !['senasa', 'global_gap', 'otro'].includes(tipo) || !numero || numero.length > 100 || !dateValid(date) || !evidencePath.test(path)) return { error: 'Completa el tipo, el número, la vigencia y el archivo del certificado.' }
  return mutate(loteId, 'subir_certificado', { p_lote_id: loteId, p_tipo: tipo, p_numero: numero, p_fecha_vencimiento: date, p_archivo_path: path }, 'Certificado enviado. Quedará en revisión hasta que un administrador lo evalúe.')
}

export async function solicitarDron(_previous: SelloActionState, form: FormData): Promise<SelloActionState> {
  await requireRole('productor')
  const loteId = text(form, 'lote_id')
  if (!uuidPattern.test(loteId)) return { error: 'No se encontró el lote. Actualiza la página.' }
  return mutate(loteId, 'solicitar_inspeccion_dron', { p_lote_id: loteId }, 'Inspección solicitada. Un administrador coordinará el vuelo contigo.')
}

export async function revisarCertificado(_previous: SelloActionState, form: FormData): Promise<SelloActionState> {
  await requireRole('admin')
  const loteId = text(form, 'lote_id'), id = text(form, 'certificado_id'), estado = text(form, 'estado'), motivo = text(form, 'motivo_rechazo')
  if (!uuidPattern.test(loteId) || !uuidPattern.test(id) || !['aprobado', 'rechazado'].includes(estado)) return { error: 'Selecciona un certificado y una decisión válida.' }
  if (estado === 'rechazado' && (motivo.length < 3 || motivo.length > 1000)) return { error: 'Escribe un motivo de rechazo de 3 a 1000 caracteres.' }
  if (!(await belongsToLot('certificados', id, loteId))) return { error: 'No se encontró este certificado en el lote.' }
  return mutate(loteId, 'revisar_certificado', { p_certificado_id: id, p_estado: estado, p_motivo: estado === 'rechazado' ? motivo : null }, `Certificado ${estado}. El productor recibió una notificación.`)
}

export async function completarDron(_previous: SelloActionState, form: FormData): Promise<SelloActionState> {
  await requireRole('admin')
  const loteId = text(form, 'lote_id'), id = text(form, 'inspeccion_id'), date = text(form, 'fecha_vuelo'), notas = text(form, 'notas')
  const lat = text(form, 'latitud'), lon = text(form, 'longitud')
  let paths: unknown
  try { paths = JSON.parse(text(form, 'evidencia_paths')) } catch { return { error: 'Sube las fotos o el video de la inspección.' } }
  if (!uuidPattern.test(loteId) || !uuidPattern.test(id) || !dateValid(date) || !lat || !lon || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon)) || Math.abs(Number(lat)) > 90 || Math.abs(Number(lon)) > 180 || notas.length > 2000) return { error: 'Revisa la fecha, las coordenadas GPS y las notas de hasta 2000 caracteres.' }
  if (!Array.isArray(paths) || paths.length < 1 || paths.length > 6 || new Set(paths).size !== paths.length || paths.some(path => typeof path !== 'string' || !evidencePath.test(path))) return { error: 'Agrega de 1 a 6 fotos o videos válidos de este lote.' }
  if (!(await belongsToLot('inspecciones_dron', id, loteId))) return { error: 'No se encontró esta solicitud de inspección en el lote.' }
  return mutate(loteId, 'completar_inspeccion_dron', { p_inspeccion_id: id, p_latitud: Number(lat), p_longitud: Number(lon), p_fecha_vuelo: date, p_evidencia_paths: paths, p_notas: notas || null }, 'Inspección completada. El lote cuenta con verificación con dron.')
}

export async function registrarTest(_previous: SelloActionState, form: FormData): Promise<SelloActionState> {
  await requireRole('admin')
  const loteId = text(form, 'lote_id'), kit = text(form, 'tipo_kit'), date = text(form, 'fecha_prueba'), resultado = text(form, 'resultado'), path = text(form, 'foto_path')
  if (!uuidPattern.test(loteId) || kit.length < 2 || kit.length > 120 || !dateValid(date) || !['pasa', 'no_pasa'].includes(resultado) || !evidencePath.test(path)) return { error: 'Completa el kit, la fecha, el resultado y la foto de evidencia del test.' }
  return mutate(loteId, 'registrar_test_residuos', { p_lote_id: loteId, p_tipo_kit: kit, p_fecha_prueba: date, p_resultado: resultado, p_foto_path: path }, resultado === 'no_pasa' ? 'Test registrado. El lote quedó bloqueado y retirado del marketplace; se notificó al productor y a los administradores.' : 'Test registrado con resultado pasa. Un bloqueo previo se conserva.')
}
