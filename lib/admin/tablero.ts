import 'server-only'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { Pedido } from '@/lib/transacciones/types'

export type Ranking = { id?: string; nombre: string; pedidos: number; valor: number }
export type Tablero = {
  kpis: { pedidos: number; acuerdos: number; valor_acordado: number; valor_pagado: number; concluidos: number; rechazados: number; cancelados: number; ticket_promedio: number; horas_respuesta: number | null; horas_hasta_pago: number | null; valor_mercado_pago: number; compradores: number; productores: number }
  embudo: { fase: string; n: number }[]
  semanas: { semana: string; pedidos: number; valor: number }[]
  alertas: { clave: string; titulo: string; ids: string[] }[]
  cultivos: Ranking[]; regiones: Ranking[]; productores: Ranking[]; compradores: Ranking[]
  metodos: { metodo: string; pedidos: number; valor: number }[]
  transacciones: (Pedido & { ejemplo: boolean })[]
}
export const PERIODOS = [['7', 'Últimos 7 días'], ['30', 'Últimos 30 días'], ['90', 'Últimos 90 días'], ['365', 'Últimos 12 meses']] as const

// Rango en fechas de Lima a partir de un periodo en días (por defecto 90).
export function rangoDe(periodo?: string) {
  const dias = PERIODOS.some(([v]) => v === periodo) ? Number(periodo) : 90
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
  const desde = new Date(`${hoy}T12:00:00Z`); desde.setUTCDate(desde.getUTCDate() - (dias - 1))
  return { desde: desde.toISOString().slice(0, 10), hasta: hoy, dias }
}

export async function getTablero(desde: string, hasta: string, soloReales: boolean): Promise<{ tablero: Tablero | null; error: boolean }> {
  await requireRole('admin')
  try {
    const db = await createClient()
    const { data, error } = await db.rpc('tablero_transacciones', { p_desde: desde, p_hasta: hasta, p_solo_reales: soloReales })
    return { tablero: data as Tablero | null, error: Boolean(error) }
  } catch { return { tablero: null, error: true } }
}
