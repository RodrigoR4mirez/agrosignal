'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import type { ActionState } from '@/lib/supabase/types'

const texto = (form: FormData, clave: string) => String(form.get(clave) ?? '').trim()
// Listas escritas separadas por comas: "Mango, Limón" → ['Mango', 'Limón']
const lista = (valor: string, maximo: number) => [...new Set(valor.split(',').map(x => x.trim()).filter(x => x.length >= 2 && x.length <= 60))].slice(0, maximo)

export async function seguirProductorAction(_: ActionState & { siguiendo?: boolean }, form: FormData): Promise<ActionState & { siguiendo?: boolean }> {
  await requireRole('comprador')
  const productor = texto(form, 'productor_id'), seguir = texto(form, 'seguir') === '1'
  if (!uuidPattern.test(productor)) return { error: 'No encontramos a ese productor.' }
  const db = await createClient()
  const { error } = await db.rpc('seguir_productor', { p_productor_id: productor, p_seguir: seguir })
  if (error) return { error: 'No pudimos guardar el cambio. Intenta nuevamente.' }
  revalidatePath(`/marketplace/productor/${productor}`); revalidatePath('/panel-comprador')
  return { siguiendo: seguir }
}

export async function crearAlertaAction(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireRole('comprador')
  const cultivo = texto(form, 'cultivo'), precio = texto(form, 'precio_maximo_kg')
  if (cultivo.length < 2 || cultivo.length > 60) return { error: 'Escribe un cultivo de 2 a 60 caracteres, por ejemplo "palta".' }
  const maximo = precio ? Number(precio) : null
  if (maximo !== null && (!Number.isFinite(maximo) || maximo <= 0 || !/^\d{1,9}(\.\d{1,2})?$/.test(precio))) return { error: 'El precio máximo debe ser mayor a cero, con hasta 2 decimales.' }
  const db = await createClient()
  const { error } = await db.from('alertas_precio').insert({ comprador_id: profile.id, cultivo, precio_maximo_kg: maximo })
  if (error?.code === '23505') return { error: `Ya tienes una alerta de ${cultivo}.` }
  if (error?.code === '22023') return { error: 'Puedes tener hasta 10 alertas. Borra una para crear otra.' }
  if (error) return { error: 'No pudimos crear la alerta. Intenta nuevamente.' }
  revalidatePath('/panel-comprador')
  return { success: `Listo. Te avisaremos cuando se publique ${cultivo}${maximo ? ` a S/ ${maximo.toFixed(2)} por kg o menos` : ''}.` }
}

export async function borrarAlertaAction(form: FormData) {
  await requireRole('comprador')
  const id = texto(form, 'alerta_id')
  if (!uuidPattern.test(id)) return
  const db = await createClient()
  await db.from('alertas_precio').delete().eq('id', id)
  revalidatePath('/panel-comprador')
}

export async function guardarPerfilComprador(_: ActionState, form: FormData): Promise<ActionState> {
  const profile = await requireRole('comprador')
  const volumen = texto(form, 'volumen_mensual_kg')
  const datos = {
    empresa: texto(form, 'empresa') || null, rubro: texto(form, 'rubro') || null, sobre_mi: texto(form, 'sobre_mi') || null,
    volumen_mensual_kg: volumen ? Number(volumen) : null,
    cultivos_interes: lista(texto(form, 'cultivos_interes'), 12), mercados_destino: lista(texto(form, 'mercados_destino'), 10),
  }
  if (datos.volumen_mensual_kg !== null && (!Number.isFinite(datos.volumen_mensual_kg) || datos.volumen_mensual_kg <= 0)) return { error: 'El volumen mensual debe ser un número mayor a cero.' }
  if ((datos.empresa && datos.empresa.length < 2) || (datos.rubro && datos.rubro.length < 2)) return { error: 'La empresa y el rubro deben tener al menos 2 caracteres.' }
  if (datos.sobre_mi && datos.sobre_mi.length > 600) return { error: 'La presentación puede tener hasta 600 caracteres.' }
  const db = await createClient()
  const { data, error } = await db.from('perfiles').update(datos).eq('id', profile.id).select('id').maybeSingle()
  if (error?.code === '23514') return { error: 'Revisa los datos: la empresa admite hasta 120 caracteres y el rubro hasta 80.' }
  if (error || !data) return { error: 'No pudimos guardar tu perfil. Intenta nuevamente.' }
  revalidatePath('/panel-comprador'); revalidatePath(`/compradores/${profile.id}`)
  return { success: 'Perfil guardado. Lo verán los productores con los que tengas pedidos.' }
}
