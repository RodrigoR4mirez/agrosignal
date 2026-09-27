import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/supabase/auth'
import { uuidPattern } from '@/lib/marketplace/types'
import { sitio, verificarPago } from '@/lib/pagos/mercadopago'

// El comprador vuelve de Mercado Pago. Verificamos el pago en el momento (sin esperar el aviso).
export async function GET(request: NextRequest) {
  await requireRole('comprador')
  const q = request.nextUrl.searchParams
  const pedido = q.get('pedido') ?? '', pagoId = q.get('payment_id') ?? q.get('collection_id') ?? ''
  if (!uuidPattern.test(pedido)) return NextResponse.redirect(`${sitio()}/panel-comprador`)
  let estado = 'cancelado'
  if (pagoId && pagoId !== 'null') {
    try { estado = await verificarPago(pedido, pagoId) } catch (e) { console.error('Retorno de Mercado Pago:', e); estado = 'pendiente' }
  }
  return NextResponse.redirect(`${sitio()}/panel-comprador/pedidos/${pedido}?pago=${estado}`)
}
