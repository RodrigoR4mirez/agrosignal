import { NextResponse, type NextRequest } from 'next/server'
import { uuidPattern } from '@/lib/marketplace/types'
import { configMercadoPago, firmaValida, verificarPago } from '@/lib/pagos/mercadopago'

// Avisos de Mercado Pago (tipo "payment"). Se valida la firma y luego se consulta el pago en
// Mercado Pago antes de registrarlo; el contenido del aviso nunca se usa como prueba de pago.
export async function POST(request: NextRequest) {
  const cfg = configMercadoPago()
  if (!cfg) return NextResponse.json({ ok: false }, { status: 404 })
  const q = request.nextUrl.searchParams
  const cuerpo = await request.json().catch(() => ({})) as { type?: string; data?: { id?: string | number } }
  const tipo = q.get('type') ?? q.get('topic') ?? cuerpo.type
  const pagoId = String(q.get('data.id') ?? q.get('id') ?? cuerpo.data?.id ?? '')
  const pedido = q.get('pedido') ?? ''
  if (!cfg.webhookSecret && process.env.NODE_ENV === 'production') {
    console.error('Webhook de Mercado Pago: falta MP_WEBHOOK_SECRET; se rechaza el aviso.')
    return NextResponse.json({ ok: false }, { status: 503 }) // el pago se confirma igual al volver (retorno)
  }
  if (cfg.webhookSecret && !firmaValida(request.headers.get('x-signature'), request.headers.get('x-request-id'), q.get('data.id'), cfg.webhookSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  if (tipo !== 'payment' || !uuidPattern.test(pedido) || !/^\d{1,30}$/.test(pagoId)) return NextResponse.json({ ok: true })
  try {
    const estado = await verificarPago(pedido, pagoId)
    return NextResponse.json({ ok: true, estado })
  } catch (e) {
    console.error('Webhook de Mercado Pago:', e)
    return NextResponse.json({ ok: false }, { status: 500 }) // Mercado Pago reintentará
  }
}
