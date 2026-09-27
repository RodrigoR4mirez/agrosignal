import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth'
import { configMercadoPago, sitio, urlAutorizacion } from '@/lib/pagos/mercadopago'

// El productor inicia la conexión: guardamos un "state" de un solo uso y lo enviamos a Mercado Pago.
export async function GET() {
  await requireRole('productor')
  if (!configMercadoPago()) return NextResponse.redirect(`${sitio()}/panel-productor?mp=no-disponible`)
  const state = randomBytes(24).toString('base64url')
  const res = NextResponse.redirect(urlAutorizacion(state))
  res.cookies.set('mp_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/mercadopago', maxAge: 600 })
  return res
}
