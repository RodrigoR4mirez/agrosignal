// Completa los datos de EJEMPLO que ve un comprador: foto referencial (Pexels) y región de cada
// comprador de ejemplo, alertas de precio, y varias fotos en tres lotes para mostrar la galería.
// Créditos en docs/creditos-fotos-ejemplo.md. Idempotente: salta lo que ya está cargado.
// Uso: node scripts/completar-ejemplos.mjs <repo>
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

const [REPO] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(path.join(REPO, '.env.local'), 'utf8').split('\n')
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SR = env.SUPABASE_SERVICE_ROLE_KEY
async function api(method, url, body) {
  const r = await fetch(URL + url, { method, headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body && JSON.stringify(body) })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${t}`)
  return t ? JSON.parse(t) : null
}
async function subir(bucket, ruta, contenido) {
  const r = await fetch(`${URL}/storage/v1/object/${bucket}/${ruta}`, { method: 'POST', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'image/jpeg' }, body: contenido })
  if (!r.ok) throw new Error(`subir ${bucket}/${ruta} → ${r.status} ${await r.text()}`)
}
async function pexels(id, ancho) {
  const r = await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${ancho}`)
  if (!r.ok) throw new Error(`Pexels ${id} → ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}

// Comprador → [id de foto en Pexels, región].
const COMPRADORES = {
  'Andrea Torres Villanueva': ['10041280', 'Lima'], 'Miguel Ángel Rivas Cornejo': ['19785045', 'Lima'],
  'Lucía Benavides Ormeño': ['18477780', 'Lima'], 'Jorge Luis Castañeda Rey': ['34299170', 'La Libertad'],
  'Patricia Huertas Molina': ['15177076', 'Arequipa'], 'Renzo Alvarado Pacheco': ['28243040', 'Lima'],
  'Sofía Delgado Arana': ['16342601', 'Lima'], 'Óscar Villena Campos': ['13100886', 'Lima'],
  'Karina Zegarra Lizárraga': ['37302655', 'Ica'], 'Álvaro Montoya Rospigliosi': ['34627219', 'Lima'],
  'Diana Palomino Cáceres': ['28386379', 'Lima'], 'Héctor Nakamura Flores': ['10041264', 'Lima'],
  'Verónica Ascencio Ruiz': ['39283714', 'Lima'], 'Gustavo Lecca Núñez': ['17582358', 'Piura'],
  'Milagros Quiroz Durand': ['37479150', 'Lima'], 'Ricardo Solís Arévalo': ['8815882', 'Cusco'],
  'Fiorella Chirinos Vega': ['10573031', 'Arequipa'], 'Eduardo Pflücker Bustamante': ['39284036', 'Lima'],
  'Claudia Mendoza Aguirre': ['38008779', 'Lima'], 'Raúl Gamarra Ttito': ['16962613', 'Cusco'],
  'Carmen Rosa Vílchez Otárola': ['30599317', 'Lima'], 'Julio César Paredes Loayza': ['16346703', 'Lima'],
}
// Lote → fotos de Pexels que se agregan (hasta 5 en total).
const GALERIAS = {
  '34533265-d051-479e-95b1-18bc86a522a9': { reemplazar: true, cantidad: 2400, fotos: ['11669609', '3687927', '33723580', '19610913', '11911814'] }, // Palta Hass · Wilfredo Quispe
  '51865fd9-8703-4c0e-b1b6-d28d97c7da0a': { fotos: ['31747251', '8113067', '39299678'] }, // Palta Hass · Rosa Huamán
  '4d2874ce-5c2d-43d6-ae92-b73c1ef60646': { fotos: ['10854385', '14111821'] }, // Papa nativa · Nicolasa Mamani
}

// 1. Foto y región de los compradores.
const perfiles = await api('GET', `/rest/v1/perfiles?select=id,nombre_completo,foto,region,cultivos_interes&rol=eq.comprador&nombre_completo=in.(${Object.keys(COMPRADORES).map(n => `"${n}"`).join(',')})`)
for (const p of perfiles) {
  const [foto, region] = COMPRADORES[p.nombre_completo]
  const cambios = p.region ? {} : { region }
  if (!p.foto) {
    const ruta = `${p.id}/${randomUUID()}.jpg`
    await subir('fotos-perfil', ruta, await sharp(await pexels(foto, 1200)).resize(600, 600, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 82 }).toBuffer())
    cambios.foto = ruta
  }
  if (Object.keys(cambios).length) await api('PATCH', `/rest/v1/perfiles?id=eq.${p.id}`, cambios)
  console.log('Comprador:', p.nombre_completo, Object.keys(cambios).join(', ') || 'sin cambios')
}

// 2. Alertas de precio: una o dos por comprador, de sus cultivos de interés.
const precios = await api('GET', '/rest/v1/catalogo_lotes?select=cultivo,precio_unidad,unidad')
const precioDe = cultivo => precios.filter(l => l.unidad === 'kg' && l.cultivo.toLowerCase().startsWith(cultivo.toLowerCase().split(' ')[0])).map(l => Number(l.precio_unidad))
for (const [i, p] of perfiles.entries()) {
  const previas = await api('GET', `/rest/v1/alertas_precio?select=id&comprador_id=eq.${p.id}`)
  if (previas.length) continue
  for (const cultivo of (p.cultivos_interes ?? []).slice(0, 1 + (i % 2))) {
    const lista = precioDe(cultivo)
    const maximo = lista.length ? Math.round(Math.min(...lista) * 0.95 * 10) / 10 : null
    await api('POST', '/rest/v1/alertas_precio', { comprador_id: p.id, cultivo, precio_maximo_kg: maximo })
  }
}
console.log('Alertas de precio listas.')

// 3. Galerías de fotos en tres lotes.
for (const [id, g] of Object.entries(GALERIAS)) {
  const [lote] = await api('GET', `/rest/v1/lotes?select=id,productor_id,cultivo,fotos,cantidad_disponible&id=eq.${id}`)
  if (!lote || lote.fotos.length >= (g.reemplazar ? g.fotos.length : 1 + g.fotos.length)) { console.log('Galería ya cargada:', lote?.cultivo); continue }
  const nuevas = []
  for (const foto of g.fotos) {
    const ruta = `${lote.productor_id}/${lote.id}/${randomUUID()}.jpg`
    await subir('fotos-lotes', ruta, await sharp(await pexels(foto, 1600)).jpeg({ quality: 84 }).toBuffer())
    nuevas.push(ruta)
  }
  const cambios = { fotos: (g.reemplazar ? nuevas : [...lote.fotos, ...nuevas]).slice(0, 5) }
  if (g.cantidad && Number(lote.cantidad_disponible) === 0) cambios.cantidad_disponible = g.cantidad
  await api('PATCH', `/rest/v1/lotes?id=eq.${id}`, cambios)
  console.log('Galería:', lote.cultivo, cambios.fotos.length, 'fotos')
}
