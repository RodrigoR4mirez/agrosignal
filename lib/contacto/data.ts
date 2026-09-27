import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { MensajeContacto } from './types'

export async function listMensajesContacto(pendientes = false): Promise<{ items: MensajeContacto[]; error: boolean }> {
  await requireRole('admin')
  const db = await createClient()
  let query = db.from('mensajes_contacto').select('id,nombre,correo,telefono,perfil,asunto,mensaje,atendido,creado_en').order('creado_en', { ascending: false }).limit(100)
  if (pendientes) query = query.eq('atendido', false)
  const { data, error } = await query
  return { items: (data ?? []) as MensajeContacto[], error: Boolean(error) }
}
