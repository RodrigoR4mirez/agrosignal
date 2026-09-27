'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern } from '@/lib/marketplace/types'
import { configMercadoPago, crearPreferencia, desconectarCuenta } from '@/lib/pagos/mercadopago'
import type { ActionState } from '@/lib/supabase/types'

// El comprador pide pagar un pedido con Mercado Pago: se crea la preferencia a nombre del productor.
export async function pagarConMercadoPagoAction(_: ActionState & { url?: string }, form: FormData): Promise<ActionState & { url?: string }> {
  await requireRole('comprador')
  const id = String(form.get('pedido_id') ?? '')
  if (!uuidPattern.test(id)) return { error: 'El pedido no es válido.' }
  if (!configMercadoPago()) return { error: 'El pago en línea no está disponible por ahora. Puedes pagar directo al productor.' }
  const db = await createClient()
  const { data: p } = await db.from('pedidos').select('id,productor_id,cultivo,cantidad,unidad,total,estado,forma_pago,flujo,pago_confirmado_en').eq('id', id).maybeSingle()
  if (!p || p.flujo !== 2) return { error: 'No encontramos el pedido.' }
  const corresponde = (p.forma_pago === 'antes_envio' && p.estado === 'confirmado') || (p.forma_pago === 'contra_entrega' && ['enviado', 'recibido'].includes(p.estado))
  if (!corresponde || p.pago_confirmado_en) return { error: 'Este pedido no tiene un pago pendiente.' }
  try { return { url: await crearPreferencia(p) } } catch (e) { return { error: e instanceof Error ? e.message : 'No pudimos iniciar el pago.' } }
}

export async function desconectarMercadoPagoAction(): Promise<ActionState> {
  const profile = await requireRole('productor')
  try { await desconectarCuenta(profile.id) } catch { return { error: 'No pudimos desconectar la cuenta. Intenta nuevamente.' } }
  revalidatePath('/panel-productor')
  return { success: 'Cuenta de Mercado Pago desconectada.' }
}
