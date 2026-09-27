// Datos de EJEMPLO para favoritos, perfil del comprador e historial de precios
// (después de cargar-ejemplos.mjs y ampliar-ejemplos.mjs). Idempotente.
// Uso: node scripts/ejemplos-comunidad.mjs <repo>
import fs from 'node:fs'
import path from 'node:path'

const [REPO] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(path.join(REPO, '.env.local'), 'utf8').split('\n')
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SR = env.SUPABASE_SERVICE_ROLE_KEY
async function api(method, url, body, headers = {}) {
  const r = await fetch(URL + url, { method, headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': 'application/json', ...headers }, body: body && JSON.stringify(body) })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${t}`)
  return t ? JSON.parse(t) : null
}

// Perfil de compra de los 20 compradores de ejemplo (mismo orden de nombres que cargar-ejemplos.mjs).
const COMPRADORES = {
  'Andrea Torres Villanueva': ['Distribuidora Andina de Alimentos', 'Distribución a supermercados', ['Palta', 'Mandarina', 'Uva'], 15000, ['Lima', 'Arequipa'], 'Abastecemos a tiendas de Lima y Arequipa. Buscamos fruta pareja y entregas semanales.'],
  'Miguel Ángel Rivas Cornejo': ['Agroexport Pacífico', 'Agroexportación', ['Palta', 'Arándano', 'Espárrago'], 60000, ['Estados Unidos', 'Países Bajos'], 'Exportamos fruta fresca por vía marítima. Pedimos calibre y trazabilidad por lote.'],
  'Lucía Benavides Ormeño': [null, 'Restaurante', ['Papa', 'Ají amarillo', 'Maíz morado'], 600, ['Lima'], 'Cocina peruana en Barranco. Compramos directo para cuidar la calidad de cada plato.'],
  'Jorge Luis Castañeda Rey': ['Berries del Norte', 'Agroexportación', ['Arándano', 'Uva', 'Granada'], 40000, ['Estados Unidos', 'Reino Unido', 'China'], 'Consolidamos arándano y uva de productores medianos de la costa norte.'],
  'Patricia Huertas Molina': ['Tubérculos del Sur', 'Venta mayorista', ['Cebolla', 'Papa'], 50000, ['Lima', 'Cusco'], 'Mayoristas de cebolla y papa. Pagamos contra entrega en mercado.'],
  'Renzo Alvarado Pacheco': ['Jugos Vitales', 'Procesamiento de pulpa', ['Maracuyá', 'Mango', 'Piña'], 25000, ['Lima'], 'Planta de pulpas y jugos. Recibimos fruta madura para proceso.'],
  'Sofía Delgado Arana': [null, 'Bodega de barrio', ['Palta', 'Mandarina', 'Limón'], 800, ['Lima'], 'Bodega familiar en Surco; compramos fruta fresca cada semana.'],
  'Óscar Villena Campos': ['Café de Origen Perú', 'Exportación de café', ['Café', 'Cacao'], 20000, ['Alemania', 'Estados Unidos'], 'Tostadores y exportadores de cafés especiales con puntaje mayor a 83.'],
  'Karina Zegarra Lizárraga': ['Conservas Costa Sur', 'Industria conservera', ['Alcachofa', 'Espárrago', 'Ají amarillo'], 30000, ['Lima', 'España'], 'Conservera en Chincha. Coordinamos cosecha y recojo con cada productor.'],
  'Álvaro Montoya Rospigliosi': ['Cacao Fino Perú', 'Exportación de cacao', ['Cacao', 'Café'], 15000, ['Bélgica', 'Suiza'], 'Compramos cacao fino de aroma bien fermentado para chocolaterías europeas.'],
  'Diana Palomino Cáceres': [null, 'Cafetería de especialidad', ['Café', 'Aguaymanto'], 300, ['Lima'], 'Cafetería en Miraflores; buscamos cafés de origen y frutos para postres.'],
  'Héctor Nakamura Flores': ['Frutas Santa Anita', 'Venta mayorista', ['Palta', 'Mango', 'Limón'], 35000, ['Lima'], 'Puesto en el mercado mayorista. Compramos volumen con pago al día.'],
  'Verónica Ascencio Ruiz': ['Snacks Andinos', 'Alimentos procesados', ['Quinua', 'Kiwicha', 'Sacha inchi', 'Maíz morado'], 10000, ['Lima', 'Chile'], 'Elaboramos barras y snacks con granos andinos.'],
  'Gustavo Lecca Núñez': ['Cítricos del Perú', 'Agroexportación', ['Mandarina', 'Limón', 'Granada'], 45000, ['Canadá', 'Reino Unido'], 'Exportamos cítricos y granada con empaque en planta certificada.'],
  'Milagros Quiroz Durand': [null, 'Tienda orgánica', ['Quinua', 'Café', 'Aguaymanto'], 400, ['Lima'], 'Tienda de productos orgánicos y de comercio justo.'],
  'Ricardo Solís Arévalo': ['Hoteles del Sur', 'Hotelería', ['Papa', 'Palta', 'Cebolla'], 3000, ['Cusco', 'Arequipa'], 'Abastecemos las cocinas de tres hoteles en el sur.'],
  'Fiorella Chirinos Vega': [null, 'Pastelería', ['Aguaymanto', 'Maracuyá', 'Mango'], 250, ['Arequipa'], 'Pastelería artesanal; usamos fruta de estación.'],
  'Eduardo Pflücker Bustamante': ['Superfoods Perú Export', 'Agroexportación', ['Quinua', 'Sacha inchi', 'Kiwicha', 'Aguaymanto'], 25000, ['Estados Unidos', 'Alemania', 'Japón'], 'Exportamos superalimentos andinos y amazónicos con certificación orgánica.'],
  'Claudia Mendoza Aguirre': ['Sabores del Perú', 'Cadena de restaurantes', ['Papa', 'Ají amarillo', 'Limón'], 5000, ['Lima', 'Trujillo'], 'Seis locales en Lima y Trujillo; compramos insumos frescos cada semana.'],
  'Raúl Gamarra Ttito': [null, 'Feria agroecológica', ['Papa nativa', 'Maíz morado', 'Kiwicha'], 500, ['Cusco'], 'Vendemos en la feria de productores de Cusco los fines de semana.'],
}
// Mes (1–12) en que cada cultivo suele estar más caro (fuera de temporada).
const MES_CARO = { palta: 12, esparrago: 3, cafe: 11, cacao: 1, arandano: 6, mango: 8, limon: 2, papa: 2, uva: 7, granada: 9, kiwicha: 3, quinua: 3, banano: 1, cebolla: 4, jengibre: 2, pina: 9, mandarina: 12, aji: 9, alcachofa: 6, maiz: 3, aguaymanto: 11, maracuya: 12, sacha: 5 }
const baseDe = cultivo => cultivo.trim().split(/\s+/)[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

const usuarios = (await api('GET', '/auth/v1/admin/users?per_page=1000')).users.filter(u => u.email?.endsWith('.ejemplo@example.com'))
const ids = usuarios.map(u => u.id).join(',')
const perfiles = await api('GET', `/rest/v1/perfiles?select=id,nombre_completo,rol&id=in.(${ids})`)
const compradores = perfiles.filter(p => p.rol === 'comprador'), productores = perfiles.filter(p => p.rol === 'productor')

// 1. Perfil de compra.
for (const c of compradores) {
  const d = COMPRADORES[c.nombre_completo]; if (!d) continue
  await api('PATCH', `/rest/v1/perfiles?id=eq.${c.id}`, { empresa: d[0], rubro: d[1], cultivos_interes: d[2], volumen_mensual_kg: d[3], mercados_destino: d[4], sobre_mi: d[5] })
}
console.log('Perfiles de comprador:', compradores.length)

// 2. Favoritos: cada comprador sigue de 2 a 5 productores.
const previos = await api('GET', `/rest/v1/favoritos?select=comprador_id&comprador_id=in.(${compradores.map(c => c.id).join(',')})&limit=1`)
if (!previos.length) {
  const filas = []
  for (const c of compradores) {
    const n = 2 + (hash(c.id) % 4)
    for (let k = 0; k < n; k++) filas.push({ comprador_id: c.id, productor_id: productores[(hash(c.id) + k * 7) % productores.length].id, creado_en: new Date(Date.now() - (5 + ((hash(c.id) + k * 13) % 120)) * 86400000).toISOString() })
  }
  const unicos = [...new Map(filas.map(f => [`${f.comprador_id}-${f.productor_id}`, f])).values()]
  await api('POST', '/rest/v1/favoritos', unicos)
  console.log('Favoritos:', unicos.length)
} else console.log('Los favoritos de ejemplo ya estaban cargados.')

// 3. Historial de precios: 8 meses de publicaciones por lote de ejemplo, con variación de temporada.
const lotes = await api('GET', `/rest/v1/lotes?select=id,cultivo,region,unidad,precio_unidad&productor_id=in.(${productores.map(p => p.id).join(',')})&borrador=eq.false`)
const hace60 = new Date(Date.now() - 60 * 86400000).toISOString()
const yaHay = await api('GET', `/rest/v1/historial_precios?select=id&ejemplo=eq.true&fuente=eq.publicacion&registrado_en=lt.${hace60}&limit=1`)
if (yaHay.length) { console.log('El historial de ejemplo ya estaba cargado. Listo.'); process.exit(0) }
const factor = (base, mes) => 1 + 0.14 * Math.cos((2 * Math.PI * (mes - (MES_CARO[base] ?? 1))) / 12)
const ahora = new Date(), mesActual = ahora.getMonth() + 1
const filas = []
for (const l of lotes) {
  const base = baseDe(l.cultivo), precioKg = l.unidad === 'ton' ? l.precio_unidad / 1000 : Number(l.precio_unidad)
  for (let atras = 1; atras <= 8; atras++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - atras, 3 + (hash(l.id + atras) % 22), 10)
    const ruido = 1 + (((hash(l.id + 'r' + atras) % 100) - 50) / 1000)
    const precio = precioKg * (factor(base, fecha.getMonth() + 1) / factor(base, mesActual)) * ruido
    filas.push({ lote_id: l.id, cultivo: l.cultivo, cultivo_base: base, region: l.region, precio_kg: Math.round(precio * 100) / 100, fuente: 'publicacion', ejemplo: true, registrado_en: fecha.toISOString() })
  }
}
await api('POST', '/rest/v1/historial_precios', filas)
console.log('Historial de precios de ejemplo:', filas.length, 'registros. Listo.')
