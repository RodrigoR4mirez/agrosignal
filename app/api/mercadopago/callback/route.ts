import { timingSafeEqual } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/supabase/auth'
import { conectarCuenta, configMercadoPago, sitio } from '@/lib/pagos/mercadopago'

// Mercado Pago vuelve aquí con ?code&state. Validamos el state y guardamos los tokens del productor.
export async function GET(request: NextRequest) {
  const profile = await requireRole('productor')
  const code = request.nextUrl.searchParams.get('code') ?? '', state = request.nextUrl.searchParams.get('state') ?? ''
  const esperado = request.cookies.get('mp_oauth_state')?.value ?? ''
  const volver = (estado: string) => { const r = NextResponse.redirect(`${sitio()}/panel-productor?mp=${estado}#cobros`); r.cookies.delete({ name: 'mp_oauth_state', path: '/api/mercadopago' }); return r }
  if (!configMercadoPago()) return volver('no-disponible')
  if (!code || !esperado || state.length !== esperado.length || !timingSafeEqual(Buffer.from(state), Buffer.from(esperado))) return volver('error')
  try { await conectarCuenta(profile.id, code) } catch (e) { console.error('Mercado Pago OAuth:', e); return volver('error') }
  return volver('conectado')
}
