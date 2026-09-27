// Pedidos de EJEMPLO en cada fase del flujo de compra, con compradores y productores de ejemplo.
// Usa las mismas funciones que la web (actuando como cada usuario) para que el historial, el stock y
// los avisos queden como en un pedido real. Los vouchers y comprobantes son PDF que dicen "ejemplo".
// Con DEMO_PASSWORD, además asigna esa contraseña a las 12 cuentas usadas. Idempotente.
// Uso: DEMO_PASSWORD='…' node --env-file=.env.local scripts/pedidos-ejemplo-fases.mjs
import { randomUUID } from 'node:crypto'

const { SUPABASE_PROJECT_REF: ref, SUPABASE_ACCESS_TOKEN: token, NEXT_PUBLIC_SUPABASE_URL: URL, SUPABASE_SERVICE_ROLE_KEY: SR, DEMO_PASSWORD } = process.env
if (!ref || !token || !URL || !SR) throw new Error('Faltan variables de .env.local')
const q = v => v === null || v === undefined ? 'null' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`
async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  const body = await r.json()
  if (!r.ok) throw new Error(`SQL ${r.status}: ${JSON.stringify(body)}`)
  return body
}
// Ejecuta una función como el usuario indicado (auth.uid() = uid).
const como = async (uid, llamada) => (await sql(`with c as (select set_config('request.jwt.claims', '{"role":"authenticated","sub":"${uid}"}', true)) select (${llamada})::text as r from c`))[0]?.r
async function subir(pedido, contenido) {
  const ruta = `${pedido}/${randomUUID()}.pdf`
  const r = await fetch(`${URL}/storage/v1/object/documentos-pedido/${ruta}`, { method: 'POST', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/pdf' }, body: contenido })
  if (!r.ok) throw new Error(`subir ${ruta}: ${r.status} ${await r.text()}`)
  return ruta
}
function pdf(lineas) {
  const texto = lineas.map((l, i) => `BT /F1 ${i ? 12 : 18} Tf 60 ${740 - i * 26} Td (${l.replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n')
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', `<< /Length ${Buffer.byteLength(texto, 'latin1')} >>\nstream\n${texto}\nendstream`]
  let out = '%PDF-1.4\n'; const offs = []
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}
const enDias = n => new Date(Date.now() + n * 86400e3).toISOString().slice(0, 10)

// Fase → comprador, lote, cantidad, entrega, forma de pago y mensaje.
const CASOS = [
  { fase: '1. Solicitud enviada', comprador: 'Andrea Torres Villanueva', lote: '51865fd9-8703-4c0e-b1b6-d28d97c7da0a', cantidad: 1000, entrega: 'envio', direccion: 'Av. Nicolás Ayllón 2890, Ate, Lima', forma: 'antes_envio', dias: 10, mensaje: 'Necesito 1 tonelada calibre 16-20 para supermercados. Entrega por la mañana.' },
  { fase: '2. Contrapropuesta del productor', comprador: 'Miguel Ángel Rivas Cornejo', lote: 'eef97323-039d-409c-8d67-c15faa2cd24e', cantidad: 2000, entrega: 'recojo', forma: 'antes_envio', dias: 7, mensaje: 'Recogemos con camión refrigerado. ¿Pueden 2 toneladas esta semana?',
    propuesta: { cantidad: 1500, precio: -0.3, dias: 12, forma: 'antes_envio', nota: 'Esta semana tengo 1.5 t con ese calibre. Te dejo mejor precio si recoges en 12 días.' } },
  { fase: '3. Acuerdo confirmado (falta el pago)', comprador: 'Lucía Benavides Ormeño', lote: 'd0d888e6-77a6-42b4-8a8c-c6b7ba626d8e', cantidad: 300, entrega: 'envio', direccion: 'Av. San Martín 511, Barranco, Lima', forma: 'antes_envio', dias: 5, mensaje: 'Para la cocina del restaurante. Sacos de 50 kg, por favor.', acuerdo: true },
  { fase: '4. Pago informado (falta confirmar)', comprador: 'Jorge Luis Castañeda Rey', lote: 'af39c888-7a42-4a31-b98e-88c271c0df68', cantidad: 2000, entrega: 'envio', direccion: 'Carretera Panamericana Norte km 558, Trujillo', forma: 'antes_envio', dias: 8, mensaje: 'Mango Kent para exportación, calibre 8-10.', acuerdo: true, pago: { metodo: 'transferencia', operacion: '00482917' } },
  { fase: '5. Pago confirmado (listo para despachar)', comprador: 'Patricia Huertas Molina', lote: '22dfcdcc-0596-4e08-bd90-2deb1e945aec', cantidad: 5000, entrega: 'envio', direccion: 'Mercado Mayorista Metropolitano, puesto 214, Arequipa', forma: 'antes_envio', dias: 6, mensaje: 'Cebolla roja en sacos de 50 kg.', acuerdo: true, pago: { metodo: 'yape_plin', operacion: '7731205' }, confirmar: true },
  { fase: '6. Compra concluida (detalle completo)', comprador: 'Héctor Nakamura Flores', lote: '2b4b40be-0f7b-44d9-a733-0baff38de358', cantidad: 1500, entrega: 'envio', direccion: 'Mercado Mayorista de Frutas N.° 2, puesto 88, La Victoria, Lima', forma: 'antes_envio', dias: 4, mensaje: 'Limón sutil verde, jabas de 20 kg.', acuerdo: true, pago: { metodo: 'transferencia', operacion: '00519384' }, confirmar: true,
    despacho: { guia: 'T001-00000812', transportista: 'Camión del productor' }, recibido: true, comprobante: 'F001-245',
    calificaciones: { comprador: [5, 'Limón muy jugoso y bien seleccionado. Llegó en la fecha pactada con su guía.'], productor: [5, 'Pagó al cerrar el acuerdo y recibió sin demoras. Muy recomendable.'] } },
]

const nombres = CASOS.map(c => q(c.comprador)).join(',')
const compradores = Object.fromEntries((await sql(`select p.nombre_completo, p.id, u.email from perfiles p join auth.users u on u.id = p.id where p.nombre_completo in (${nombres})`)).map(r => [r.nombre_completo, r]))
const cuentas = []
for (const c of CASOS) {
  const comprador = compradores[c.comprador]
  if (!comprador) throw new Error(`No existe el comprador ${c.comprador}`)
  const [lote] = await sql(`select l.id, l.cultivo, l.precio_unidad::float precio, l.productor_id, p.nombre_completo productor, u.email from lotes l join perfiles p on p.id = l.productor_id join auth.users u on u.id = l.productor_id where l.id = ${q(c.lote)}`)
  cuentas.push({ fase: c.fase, comprador: [c.comprador, comprador.email, comprador.id], productor: [lote.productor, lote.email, lote.productor_id], cultivo: lote.cultivo })
  const [previo] = await sql(`select id from pedidos where comprador_id = ${q(comprador.id)} and lote_id = ${q(c.lote)} and flujo = 2 limit 1`)
  if (previo) { console.log(`${c.fase}: ya existe (${previo.id.slice(0, 8)})`); continue }

  const id = await como(comprador.id, `public.solicitar_compra(${q(c.lote)}, ${c.cantidad}, ${q(c.entrega === 'recojo' ? 'Recojo en la chacra del productor' : c.direccion)}, ${q(randomUUID())}, ${lote.precio}, ${q(c.entrega)}, ${q(enDias(c.dias))}, ${q(c.forma)}, ${q(c.mensaje)})`)
  const P = lote.productor_id
  if (c.propuesta) {
    const p = c.propuesta
    await como(P, `public.proponer_condiciones(${q(id)}, ${Math.round((lote.precio + p.precio) * 100) / 100}, ${p.cantidad}, ${q(enDias(p.dias))}, ${q(p.forma)}, ${q(p.nota)})`)
  }
  if (c.acuerdo) await como(P, `public.cambiar_estado_pedido(${q(id)}, 'confirmado')`)
  if (c.pago) {
    const voucher = await subir(id, pdf(['Constancia de pago - DOCUMENTO DE EJEMPLO', `Pedido ${id.slice(0, 8)} - ${lote.cultivo}`, `Operacion ${c.pago.operacion}`, 'Datos de demostracion. No corresponde a un pago real.']))
    await como(comprador.id, `public.informar_pago(${q(id)}, ${q(c.pago.metodo)}, ${q(c.pago.operacion)}, ${q(voucher)})`)
  }
  if (c.confirmar) await como(P, `public.confirmar_pago(${q(id)})`)
  if (c.despacho) await como(P, `public.registrar_despacho(${q(id)}, ${q(c.despacho.guia)}, ${q(c.despacho.transportista)})`)
  if (c.recibido) await como(comprador.id, `public.cambiar_estado_pedido(${q(id)}, 'recibido')`)
  if (c.comprobante) {
    const archivo = await subir(id, pdf([`Factura electronica ${c.comprobante} - DOCUMENTO DE EJEMPLO`, `Pedido ${id.slice(0, 8)} - ${lote.cultivo}`, 'Operacion exonerada de IGV (producto agricola en estado natural)', 'Datos de demostracion. No es un comprobante real.']))
    await como(P, `public.registrar_comprobante(${q(id)}, 'factura', ${q(c.comprobante)}, ${q(archivo)})`)
  }
  if (c.calificaciones) {
    await como(comprador.id, `public.calificar_pedido(${q(id)}, ${c.calificaciones.comprador[0]}, ${q(c.calificaciones.comprador[1])})`)
    await como(P, `public.calificar_pedido(${q(id)}, ${c.calificaciones.productor[0]}, ${q(c.calificaciones.productor[1])})`)
  }
  console.log(`${c.fase}: pedido ${id.slice(0, 8)} · ${lote.cultivo}`)
}

if (DEMO_PASSWORD) {
  for (const cuenta of cuentas) for (const [, , uid] of [cuenta.comprador, cuenta.productor]) {
    const r = await fetch(`${URL}/auth/v1/admin/users/${uid}`, { method: 'PUT', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: DEMO_PASSWORD }) })
    if (!r.ok) throw new Error(`contraseña ${uid}: ${r.status} ${await r.text()}`)
  }
  console.log('Contraseña de demostración asignada a', cuentas.length * 2, 'cuentas.')
}
console.log(JSON.stringify(cuentas.map(c => ({ fase: c.fase, cultivo: c.cultivo, comprador: c.comprador.slice(0, 2), productor: c.productor.slice(0, 2) }))))
