import { createHmac, timingSafeEqual } from 'node:crypto'

// Firma de los avisos de Mercado Pago: cabecera x-signature "ts=…,v1=…" y manifiesto
// "id:<data.id en minúsculas>;request-id:<x-request-id>;ts:<ts>;" firmado con HMAC-SHA256.
// Las partes que no llegan se omiten del manifiesto.
export function firmaValida(firma: string | null, requestId: string | null, dataId: string | null, secreto: string) {
  if (!firma) return false
  const partes = Object.fromEntries(firma.split(',').map(p => p.trim().split('=') as [string, string]))
  if (!partes.ts || !partes.v1) return false
  const manifiesto = `${dataId ? `id:${dataId.toLowerCase()};` : ''}${requestId ? `request-id:${requestId};` : ''}ts:${partes.ts};`
  const esperado = createHmac('sha256', secreto).update(manifiesto).digest('hex')
  return esperado.length === partes.v1.length && timingSafeEqual(Buffer.from(esperado), Buffer.from(partes.v1))
}
