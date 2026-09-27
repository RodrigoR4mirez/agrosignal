import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { AlertaPrecio, PerfilComprador, PuntoPrecio, ProductorSeguido } from './types'

// ¿El comprador actual sigue a este productor? (RLS: solo ve sus propios favoritos)
export async function getSiguiendo(productorId: string) {
  const db = await createClient()
  const { data } = await db.from('favoritos').select('productor_id').eq('productor_id', productorId).maybeSingle()
  return Boolean(data)
}
export async function listSeguidos() {
  const db = await createClient()
  const { data, error } = await db.rpc('mis_productores_seguidos')
  return { productores: (data ?? []) as ProductorSeguido[], error: Boolean(error) }
}
export async function listAlertas() {
  const db = await createClient()
  const { data, error } = await db.from('alertas_precio').select('id,cultivo,precio_maximo_kg,creado_en').order('creado_en', { ascending: false })
  return { alertas: (data ?? []) as AlertaPrecio[], error: Boolean(error) }
}
// null = no existe; 'sin-permiso' = no tiene pedidos con ese comprador.
export async function getPerfilComprador(id: string): Promise<PerfilComprador | null | 'sin-permiso'> {
  const db = await createClient()
  const { data, error } = await db.rpc('perfil_comprador', { p_comprador_id: id })
  if (error?.code === '42501') return 'sin-permiso'
  if (error) throw new Error('No se pudo cargar el perfil del comprador.')
  return data as PerfilComprador | null
}
export async function getHistorialPrecios(cultivo: string, meses = 12) {
  const db = await createClient()
  const { data, error } = await db.rpc('historial_precio_cultivo', { p_cultivo: cultivo, p_meses: meses })
  return { serie: ((data ?? []) as PuntoPrecio[]).map(p => ({ ...p, publicado: p.publicado === null ? null : Number(p.publicado), vendido: p.vendido === null ? null : Number(p.vendido), minimo: Number(p.minimo), maximo: Number(p.maximo) })), error: Boolean(error) }
}
export async function getCultivosConPrecios() {
  const db = await createClient()
  const { data, error } = await db.rpc('cultivos_con_precios')
  return { cultivos: (data ?? []) as { cultivo_base: string; nombre: string; registros: number }[], error: Boolean(error) }
}
