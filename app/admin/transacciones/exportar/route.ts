import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { rangoDe } from '@/lib/admin/tablero'

const COLUMNAS = ['id', 'creado_en', 'estado', 'cultivo', 'cantidad', 'unidad', 'precio_unidad', 'total', 'comprador_nombre', 'productor_nombre', 'forma_pago', 'acordado_en', 'pago_metodo', 'pago_operacion', 'pago_confirmado_en', 'guia_remision', 'enviado_en', 'recibido_en', 'comprobante_tipo', 'comprobante_numero', 'observacion_en', 'flujo'] as const
const celda = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(s) || /^[=+\-@]/.test(s) ? `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"` : s }

// CSV de todas las transacciones del periodo (para contabilidad y auditoría). Solo administradores.
export async function GET(request: NextRequest) {
  await requireRole('admin')
  const q = request.nextUrl.searchParams
  const { desde, hasta } = rangoDe(q.get('periodo') ?? undefined)
  const inicio = new Date(`${desde}T05:00:00Z`).toISOString(), fin = new Date(new Date(`${hasta}T05:00:00Z`).getTime() + 86400e3).toISOString()
  const db = await createClient()
  let consulta = db.from('pedidos').select(`${COLUMNAS.join(',')},lotes!inner(descripcion)`).gte('creado_en', inicio).lt('creado_en', fin).order('creado_en', { ascending: false }).limit(10000)
  if (q.get('reales') === '1') consulta = consulta.not('lotes.descripcion', 'like', '[Ejemplo] %')
  const { data, error } = await consulta
  if (error) return NextResponse.json({ error: 'No pudimos generar el archivo.' }, { status: 500 })
  const filas = ((data ?? []) as unknown as (Record<string, unknown> & { lotes?: { descripcion?: string } })[]).map(p => [...COLUMNAS.map(c => celda(p[c])), (p.lotes?.descripcion ?? '').startsWith('[Ejemplo] ') ? 'si' : 'no'].join(','))
  const csv = '﻿' + [[...COLUMNAS, 'ejemplo'].join(','), ...filas].join('\n')
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="agrosignal-transacciones-${desde}-a-${hasta}.csv"`, 'Cache-Control': 'private, no-store' } })
}
