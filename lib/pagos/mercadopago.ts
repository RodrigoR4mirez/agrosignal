import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { createClient as createSupabase } from '@supabase/supabase-js'

// Integración con Mercado Pago (marketplace, split 1:1). Solo servidor.
// Variables: MP_CLIENT_ID, MP_CLIENT_SECRET (obligatorias), MP_WEBHOOK_SECRET (firma de avisos),
// MP_COMISION_PORCENTAJE (comisión de AgroSignal, por defecto 0), MP_MODO_PRUEBA ('true' en sandbox).
const API = 'https://api.mercadopago.com'

export function configMercadoPago() {
  const { MP_CLIENT_ID: clientId, MP_CLIENT_SECRET: clientSecret } = process.env
  if (!clientId || !clientSecret || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  const comision = Math.min(20, Math.max(0, Number(process.env.MP_COMISION_PORCENTAJE) || 0))
  return { clientId, clientSecret, comision, prueba: process.env.MP_MODO_PRUEBA === 'true', webhookSecret: process.env.MP_WEBHOOK_SECRET || null }
}
export const sitio = () => new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://agrosignal.vercel.app').origin
export const redirectUri = () => `${sitio()}/api/mercadopago/callback`

// Cliente con clave de servicio: solo para la tabla de cuentas y para registrar pagos verificados.
function db() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
}

// AES-256-GCM con clave derivada del secreto de la aplicación (si cambia, el productor vuelve a conectar).
const clave = () => createHash('sha256').update(`${configMercadoPago()!.clientSecret}:agrosignal-tokens-mp`).digest()
function cifrar(texto: string) {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', clave(), iv)
  const datos = Buffer.concat([c.update(texto, 'utf8'), c.final()])
  return [iv, c.getAuthTag(), datos].map(b => b.toString('base64url')).join('.')
}
function descifrar(valor: string) {
  const [iv, tag, datos] = valor.split('.').map(p => Buffer.from(p, 'base64url'))
  const d = createDecipheriv('aes-256-gcm', clave(), iv); d.setAuthTag(tag)
  return Buffer.concat([d.update(datos), d.final()]).toString('utf8')
}

type TokenMP = { access_token: string; refresh_token: string; user_id: number | string; expires_in: number; live_mode?: boolean }
async function pedirToken(cuerpo: Record<string, unknown>): Promise<TokenMP> {
  const cfg = configMercadoPago()!
  const r = await fetch(`${API}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, signal: AbortSignal.timeout(10000),
    body: JSON.stringify({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...cuerpo }) })
  const json = await r.json().catch(() => null)
  if (!r.ok || !json?.access_token) throw new Error(`Mercado Pago rechazó la autorización (${r.status}).`)
  return json
}

export function urlAutorizacion(state: string) {
  const cfg = configMercadoPago()!
  const q = new URLSearchParams({ client_id: cfg.clientId, response_type: 'code', platform_id: 'mp', state, redirect_uri: redirectUri() })
  return `https://auth.mercadopago.com/authorization?${q}`
}

export async function conectarCuenta(productorId: string, code: string) {
  const cfg = configMercadoPago()!
  const t = await pedirToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), test_token: cfg.prueba })
  const { error } = await db().from('cuentas_mercadopago').upsert({
    productor_id: productorId, mp_user_id: String(t.user_id), access_token_cifrado: cifrar(t.access_token), refresh_token_cifrado: cifrar(t.refresh_token),
    expira_en: new Date(Date.now() + t.expires_in * 1000).toISOString(), modo_prueba: cfg.prueba, conectado_en: new Date().toISOString(), actualizado_en: new Date().toISOString(),
  })
  if (error) throw new Error('No pudimos guardar la conexión.')
}

export async function desconectarCuenta(productorId: string) {
  const { error } = await db().from('cuentas_mercadopago').delete().eq('productor_id', productorId)
  if (error) throw new Error('No pudimos desconectar la cuenta.')
}

// Token vigente del productor; lo renueva si vence en menos de 3 días.
async function tokenDe(productorId: string) {
  const { data } = await db().from('cuentas_mercadopago').select('*').eq('productor_id', productorId).maybeSingle()
  if (!data) return null
  if (new Date(data.expira_en).getTime() - Date.now() > 3 * 86400e3) return descifrar(data.access_token_cifrado)
  const t = await pedirToken({ grant_type: 'refresh_token', refresh_token: descifrar(data.refresh_token_cifrado) })
  await db().from('cuentas_mercadopago').update({ access_token_cifrado: cifrar(t.access_token), refresh_token_cifrado: cifrar(t.refresh_token), expira_en: new Date(Date.now() + t.expires_in * 1000).toISOString(), actualizado_en: new Date().toISOString() }).eq('productor_id', productorId)
  return t.access_token
}

type PedidoPago = { id: string; productor_id: string; cultivo: string; cantidad: number; unidad: string; total: number }

// Preferencia de Checkout Pro a nombre del productor; devuelve la URL de pago.
export async function crearPreferencia(p: PedidoPago) {
  const cfg = configMercadoPago()!
  const token = await tokenDe(p.productor_id)
  if (!token) throw new Error('El productor todavía no conectó su cuenta de Mercado Pago.')
  const total = Number(p.total), fee = Math.round(total * cfg.comision) / 100
  const regreso = `${sitio()}/api/mercadopago/retorno?pedido=${p.id}`
  const r = await fetch(`${API}/checkout/preferences`, { method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': `pref-${p.id}-${total}` },
    body: JSON.stringify({
      items: [{ id: p.id, title: `${p.cultivo} · ${p.cantidad} ${p.unidad}`, description: `Pedido AgroSignal #${p.id.slice(0, 8)}`, quantity: 1, unit_price: total, currency_id: 'PEN', category_id: 'others' }],
      external_reference: p.id, metadata: { pedido_id: p.id },
      ...(fee > 0 ? { marketplace_fee: fee } : {}),
      back_urls: { success: regreso, pending: regreso, failure: regreso }, auto_return: 'approved',
      notification_url: `${sitio()}/api/mercadopago/webhook?pedido=${p.id}`, statement_descriptor: 'AGROSIGNAL',
    }) })
  const json = await r.json().catch(() => null)
  const url = cfg.prueba ? json?.sandbox_init_point : json?.init_point
  if (!r.ok || !url) throw new Error('Mercado Pago no pudo crear el pago. Intenta nuevamente.')
  await db().from('pedidos').update({ pago_mp_preferencia: String(json.id).slice(0, 100) }).eq('id', p.id)
  return url as string
}

// Consulta el pago en Mercado Pago (fuente de verdad) y, si está aprobado y coincide con el pedido
// en referencia, monto y moneda, lo registra. Devuelve el estado del pago.
export async function verificarPago(pedidoId: string, pagoId: string): Promise<'aprobado' | 'pendiente' | 'rechazado' | 'invalido'> {
  if (!/^\d{1,30}$/.test(pagoId)) return 'invalido'
  const base = db()
  const { data: pedido } = await base.from('pedidos').select('id,productor_id,total,flujo').eq('id', pedidoId).maybeSingle()
  if (!pedido || pedido.flujo !== 2) return 'invalido'
  const token = await tokenDe(pedido.productor_id)
  if (!token) return 'invalido'
  const r = await fetch(`${API}/v1/payments/${pagoId}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) })
  const pago = await r.json().catch(() => null)
  if (!r.ok || !pago || pago.external_reference !== pedidoId || pago.currency_id !== 'PEN' || Math.abs(Number(pago.transaction_amount) - Number(pedido.total)) > 0.005) return 'invalido'
  if (pago.status === 'approved') {
    const { error } = await base.rpc('registrar_pago_mercadopago', { p_pedido_id: pedidoId, p_pago_id: String(pago.id), p_monto: pedido.total })
    if (error && !/ya tiene un pago/.test(error.message)) throw new Error(error.message)
    return 'aprobado'
  }
  return ['pending', 'in_process', 'authorized'].includes(pago.status) ? 'pendiente' : 'rechazado'
}

export { firmaValida } from './firma'
