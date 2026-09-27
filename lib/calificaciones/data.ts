import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import type { CalificacionAdmin, EstadoCalificacion, PerfilProductor, Resena, VendedorEnRevision } from './types'

export async function getPerfilProductor(id: string) {
  if (!uuidPattern.test(id)) return null
  const db = await createClient()
  const { data, error } = await db.rpc('perfil_productor', { p_productor_id: id })
  if (error) throw new Error('No se pudo cargar el perfil del productor.')
  return data as PerfilProductor | null
}

export async function listResenas(productorId: string, limite = 30) {
  const db = await createClient()
  const { data, error } = await db.from('resenas_productores').select('*').eq('productor_id', productorId)
    .order('creado_en', { ascending: false }).order('id').limit(limite)
  return { resenas: (data ?? []) as Resena[], error: Boolean(error) }
}

// Estado del doble ciego para la parte que mira el pedido.
export async function getEstadoCalificacion(pedidoId: string) {
  await requireRole(['comprador', 'productor'])
  if (!uuidPattern.test(pedidoId)) return null
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('estado_calificacion_pedido', { p_pedido_id: pedidoId })
    return error ? null : data as EstadoCalificacion
  } catch { return null }
}

export async function listCalificacionesPedido(pedidoId: string) {
  await requireRole('admin')
  if (!uuidPattern.test(pedidoId)) return { items: [] as CalificacionAdmin[], error: false }
  try {
    const db = await createClient()
    const { data, error } = await db.from('calificaciones').select('id,rol_calificador,estrellas,comentario,visible,creado_en').eq('pedido_id', pedidoId).order('creado_en')
    return { items: (data ?? []) as CalificacionAdmin[], error: Boolean(error) }
  } catch { return { items: [] as CalificacionAdmin[], error: true } }
}

export async function listVendedoresEnRevision() {
  await requireRole('admin')
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('vendedores_en_revision')
    return { items: (data ?? []) as VendedorEnRevision[], error: Boolean(error) }
  } catch { return { items: [] as VendedorEnRevision[], error: true } }
}
