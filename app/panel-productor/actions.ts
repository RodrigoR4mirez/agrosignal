'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { REGIONES, uuidPattern } from '@/lib/marketplace/types'
import type { ActionState } from '@/lib/supabase/types'

type SaveResult = ActionState & { id?: string; cleanupWarning?: boolean }
function parseFields(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? '').trim()
  const fields = {
    cultivo: text('cultivo'), region: text('region'), provincia: text('provincia'), distrito: text('distrito'),
    cantidad_disponible: Number(text('cantidad_disponible')), precio_unidad: Number(text('precio_unidad')),
    precio_anterior: text('precio_anterior') ? Number(text('precio_anterior')) : null,
    unidad: text('unidad'), estado_cosecha: text('estado_cosecha'), nivel_riesgo: text('nivel_riesgo'), destino: text('destino'), descripcion: text('descripcion'),
  }
  if (fields.cultivo.length < 2 || fields.cultivo.length > 100) return { error: 'Escribe un cultivo de 2 a 100 caracteres.' }
  if (!REGIONES.includes(fields.region)) return { error: 'Selecciona una región del Perú.' }
  if ([fields.provincia, fields.distrito].some(x => x.length < 2 || x.length > 80)) return { error: 'Indica la provincia y el distrito, de 2 a 80 caracteres.' }
  if (!/^\d{1,11}(\.\d{1,3})?$/.test(text('cantidad_disponible')) || !Number.isFinite(fields.cantidad_disponible)) return { error: 'Indica una cantidad válida, con hasta 3 decimales.' }
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(text('precio_unidad')) || fields.precio_unidad <= 0 || !Number.isFinite(fields.precio_unidad)) return { error: 'Indica un precio mayor a cero, con hasta 2 decimales.' }
  if (fields.precio_anterior !== null && (!/^\d{1,12}(\.\d{1,2})?$/.test(text('precio_anterior')) || !(fields.precio_anterior > fields.precio_unidad) || fields.precio_anterior > fields.precio_unidad * 20)) return { error: 'El precio antes del descuento debe ser mayor que el precio actual (hasta 20 veces), o déjalo vacío.' }
  if (!['kg', 'ton'].includes(fields.unidad) || !['disponible', 'en_cosecha', 'proxima'].includes(fields.estado_cosecha) || !['bajo', 'medio', 'alto'].includes(fields.nivel_riesgo) || !['local', 'exportacion'].includes(fields.destino)) return { error: 'Revisa la unidad, el estado de cosecha, el riesgo y el destino.' }
  if (fields.descripcion.length > 300) return { error: 'La descripción puede tener hasta 300 caracteres.' }
  return { fields }
}

export async function prepareLot(form: FormData): Promise<SaveResult> {
  const profile = await requireRole('productor')
  const parsed = parseFields(form)
  if (!parsed.fields) return { error: parsed.error }
  const id = String(form.get('id') ?? '')
  if (!uuidPattern.test(id)) return { error: 'No se pudo preparar el lote. Recarga la página.' }
  const db = await createClient()
  const existing = await db.from('lotes').select('id').eq('id', id).eq('productor_id', profile.id).maybeSingle()
  if (existing.error) return { error: 'No pudimos comprobar el lote. Intenta nuevamente.' }
  if (existing.data) return { id }
  const { error } = await db.from('lotes').insert({ ...parsed.fields, id, productor_id: profile.id, cantidad_disponible: 0, borrador: true, fotos: [] })
  if (error) return { error: 'No pudimos guardar el borrador. Intenta nuevamente.' }
  revalidatePath('/panel-productor/mis-lotes')
  return { id }
}

export async function saveLot(form: FormData): Promise<SaveResult> {
  const profile = await requireRole('productor')
  const parsed = parseFields(form)
  if (!parsed.fields) return { error: parsed.error }
  const id = String(form.get('id') ?? '')
  if (!uuidPattern.test(id)) return { error: 'El lote no es válido.' }
  let photos: unknown
  try { photos = JSON.parse(String(form.get('fotos') ?? '[]')) } catch { return { error: 'Revisa las fotos del lote.' } }
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 6 || new Set(photos).size !== photos.length || photos.some(path => typeof path !== 'string' || !new RegExp(`^${profile.id}/${id}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`).test(path))) return { error: 'Agrega de 1 a 6 fotos válidas de este lote.' }
  const db = await createClient()
  const { data: old, error: readError } = await db.from('lotes').select('fotos').eq('id', id).eq('productor_id', profile.id).maybeSingle()
  if (readError || !old) return { error: 'No encontramos este lote entre tus publicaciones.' }
  const { data, error } = await db.from('lotes').update({ ...parsed.fields, fotos: photos, borrador: false }).eq('id', id).eq('productor_id', profile.id).select('id').maybeSingle()
  if (error?.code === '22023' && error.message === 'No puedes cambiar el cultivo o la unidad mientras haya pedidos en curso.') {
    return { error: 'Este lote tiene pedidos en curso. Conserva el cultivo y la unidad; puedes actualizar los demás datos.' }
  }
  if (error || !data) return { error: 'No pudimos guardar el lote. Comprueba las fotos y vuelve a intentarlo.' }
  const removed = (old.fotos as string[]).filter(path => !(photos as string[]).includes(path))
  // Storage policies allow deletion only when the file is no longer referenced.
  const cleanup = removed.length ? await db.storage.from('fotos-lotes').remove(removed) : null
  for (const path of ['/marketplace', `/marketplace/${id}`, '/panel-productor', '/panel-productor/mis-lotes']) revalidatePath(path)
  return { id, success: 'Lote guardado.', cleanupWarning: Boolean(cleanup?.error) }
}

export async function deleteLot(_state: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireRole('productor')
  const id = String(form.get('id') ?? '')
  if (!uuidPattern.test(id) || form.get('confirmar') !== 'si') return { error: 'Confirma que deseas eliminar este lote.' }
  const db = await createClient()
  const { data, error } = await db.from('lotes').delete().eq('id', id).eq('productor_id', profile.id).select('id').maybeSingle()
  if (error?.code === '23503') return { error: 'Este lote tiene pedidos o verificaciones. Puedes poner su cantidad en cero para retirarlo del marketplace.' }
  if (error || !data) return { error: 'No pudimos eliminar el lote. Comprueba que sea tuyo e intenta nuevamente.' }
  const { data: files, error: listError } = await db.storage.from('fotos-lotes').list(`${profile.id}/${id}`, { limit: 100 })
  let cleanupFailed = Boolean(listError)
  if (files?.length) {
    const cleanup = await db.storage.from('fotos-lotes').remove(files.map(file => `${profile.id}/${id}/${file.name}`))
    cleanupFailed = Boolean(cleanup.error)
  }
  for (const path of ['/marketplace', `/marketplace/${id}`, '/panel-productor', '/panel-productor/mis-lotes']) revalidatePath(path)
  redirect(`/panel-productor/mis-lotes?eliminado=1${cleanupFailed ? '&limpieza=1' : ''}`)
}

// Guarda (o quita) la foto de perfil ya subida a fotos-perfil y borra la anterior.
export async function guardarFotoPerfil(ruta: string | null): Promise<ActionState> {
  const profile = await requireRole('productor')
  if (ruta !== null && !new RegExp(`^${profile.id}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`).test(ruta)) return { error: 'La foto no es válida. Vuelve a subirla.' }
  const db = await createClient()
  const anterior = profile.foto ?? null
  const { data, error } = await db.from('perfiles').update({ foto: ruta }).eq('id', profile.id).select('id').maybeSingle()
  if (error || !data) return { error: 'No pudimos guardar la foto. Intenta nuevamente.' }
  if (anterior && anterior !== ruta) await db.storage.from('fotos-perfil').remove([anterior])
  revalidatePath('/panel-productor'); revalidatePath('/marketplace', 'layout')
  return {}
}

// Guarda los datos de la finca del perfil público (la base valida rangos y listas permitidas).
export async function guardarPerfilFinca(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireRole('productor')
  const texto = (clave: string) => String(form.get(clave) ?? '').trim()
  const numeroOpcional = (clave: string, entero = false) => {
    const valor = texto(clave)
    if (!valor) return null
    const n = Number(valor)
    return Number.isFinite(n) && (!entero || Number.isInteger(n)) ? n : NaN
  }
  const datos = {
    finca: texto('finca') || null, asociacion: texto('asociacion') || null, sobre_mi: texto('sobre_mi') || null,
    hectareas: numeroOpcional('hectareas'), anios_experiencia: numeroOpcional('anios_experiencia', true), altitud_msnm: numeroOpcional('altitud_msnm', true),
    capacidad_mensual_kg: numeroOpcional('capacidad_mensual_kg'), latitud: numeroOpcional('latitud'), longitud: numeroOpcional('longitud'),
    meses_cosecha: [...new Set(form.getAll('meses_cosecha').map(Number))].filter(m => Number.isInteger(m) && m >= 1 && m <= 12).sort((a, b) => a - b),
    practicas: form.getAll('practicas').map(String), entregas: form.getAll('entregas').map(String),
  }
  if (Object.values(datos).some(valor => typeof valor === 'number' && Number.isNaN(valor))) return { error: 'Revisa los números: hectáreas, años, altitud, capacidad y coordenadas.' }
  if ((datos.latitud === null) !== (datos.longitud === null)) return { error: 'Escribe la latitud y la longitud, o deja ambas vacías.' }
  if (datos.finca && datos.finca.length < 2) return { error: 'El nombre de la finca debe tener al menos 2 caracteres.' }
  const db = await createClient()
  const { data, error } = await db.from('perfiles').update(datos).eq('id', profile.id).select('id').maybeSingle()
  if (error?.code === '23514') return { error: 'Algún dato está fuera de rango. Las coordenadas deben estar dentro del Perú y la altitud entre 0 y 6000 m.' }
  if (error || !data) return { error: 'No pudimos guardar tu perfil. Intenta nuevamente.' }
  revalidatePath('/panel-productor'); revalidatePath(`/marketplace/productor/${profile.id}`)
  return { success: 'Perfil guardado. Ya se ve en tu página pública.' }
}
