// Carga datos de EJEMPLO en Supabase: 15 productores, 20 compradores, 20 lotes
// (marcados con "[Ejemplo] ") y pedidos creados por los RPC reales de la app.
// Correos @example.com (dominio reservado). Idempotente: aborta si ya existen.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const [REPO, FOTOS] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(path.join(REPO, '.env.local'), 'utf8').split('\n')
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SR = env.SUPABASE_SERVICE_ROLE_KEY, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MARCA = '[Ejemplo] '
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function api(method, url, { body, token = SR, key = SR, headers = {}, raw = false } = {}) {
  for (let intento = 0; intento < 6; intento++) {
    const r = await fetch(URL + url, { method, headers: { apikey: key, Authorization: `Bearer ${token}`, ...(raw ? {} : { 'Content-Type': 'application/json' }), ...headers }, body: raw ? body : body && JSON.stringify(body) })
    const t = await r.text()
    if (r.status === 429) { console.log('  límite de tasa, esperando 60 s…'); await sleep(60000); continue }
    if (!r.ok) throw new Error(`${method} ${url} → ${r.status} ${t}`)
    return t ? JSON.parse(t) : null
  }
  throw new Error('Demasiados reintentos por límite de tasa')
}

const PRODUCTORES = [
  { n: 'Rosa Huamán Quispe', r: 'La Libertad', p: 'Virú', d: 'Chao', c: 'Palta' },
  { n: 'Julio César Paredes Tello', r: 'San Martín', p: 'Moyobamba', d: 'Jepelacio', c: 'Café' },
  { n: 'Elmer Tapullima Sangama', r: 'San Martín', p: 'Tocache', d: 'Uchiza', c: 'Cacao' },
  { n: 'Carmen Rojas Salazar', r: 'La Libertad', p: 'Trujillo', d: 'Laredo', c: 'Arándano' },
  { n: 'Wilfredo Chunga Yarlequé', r: 'Piura', p: 'Piura', d: 'Tambogrande', c: 'Mango' },
  { n: 'Nicolasa Mamani Apaza', r: 'Puno', p: 'El Collao', d: 'Ilave', c: 'Papa' },
  { n: 'Fidel Ccori Huaynate', r: 'Junín', p: 'Huancayo', d: 'Sicaya', c: 'Papa' },
  { n: 'Martha Quispe Hernández', r: 'Ica', p: 'Ica', d: 'Santiago', c: 'Uva' },
  { n: 'Teodoro Condori Mayta', r: 'Arequipa', p: 'Caylloma', d: 'Chivay', c: 'Kiwicha' },
  { n: 'Luis Alberto Vásquez Silupú', r: 'Piura', p: 'Sullana', d: 'Querecotillo', c: 'Banano' },
  { n: 'Gladys Chávez Llerena', r: 'Arequipa', p: 'Arequipa', d: 'Santa Rita de Siguas', c: 'Cebolla' },
  { n: 'Hernán Ríos Cárdenas', r: 'Junín', p: 'Chanchamayo', d: 'Pichanaqui', c: 'Jengibre' },
  { n: 'Yolanda Espinoza Cruz', r: 'Lima', p: 'Huaral', d: 'Huaral', c: 'Mandarina' },
  { n: 'Rubén Salazar Guzmán', r: 'Ica', p: 'Chincha', d: 'Pueblo Nuevo', c: 'Alcachofa' },
  { n: 'Doris Pinedo Guevara', r: 'Cajamarca', p: 'Jaén', d: 'Huabal', c: 'Café' },
]
// i = índice de productor
const LOTES = [
  { i: 0, cultivo: 'Palta Hass', cant: 18000, precio: 6.5, est: 'en_cosecha', riesgo: 'bajo', dest: 'exportacion', foto: 'palta-1.jpg', desc: 'Calibre 16 a 20, materia seca sobre 23 %. Empaque en jabas de 10 kg, cosecha escalonada hasta octubre.' },
  { i: 0, cultivo: 'Palta Fuerte', cant: 6000, precio: 3.2, est: 'disponible', riesgo: 'bajo', dest: 'local', foto: 'palta-2.jpg', desc: 'Fruta de descarte de exportación en buen estado, ideal para mercados mayoristas de Trujillo y Lima.' },
  { i: 1, cultivo: 'Café arábica pergamino', cant: 4600, precio: 17.8, est: 'disponible', riesgo: 'medio', dest: 'exportacion', foto: 'cafe-1.jpg', desc: 'Variedades catimor y caturra a 1 350 m s. n. m. Humedad 11 %, taza 83 puntos en catación local.' },
  { i: 2, cultivo: 'Cacao fino de aroma', cant: 3200, precio: 27.5, est: 'disponible', riesgo: 'bajo', dest: 'exportacion', foto: 'cacao-1.jpg', desc: 'Grano seco fermentado 6 días, prueba de corte con 80 % bien fermentado. Sacos de yute de 60 kg.' },
  { i: 3, cultivo: 'Arándano Biloxi', cant: 7500, precio: 12.5, est: 'en_cosecha', riesgo: 'bajo', dest: 'exportacion', foto: 'arandano-1.jpg', desc: 'Calibre 14 mm+, clamshell de 125 g. Cadena de frío desde campo, campaña septiembre a diciembre.' },
  { i: 3, cultivo: 'Arándano Ventura', cant: 3000, precio: 10.9, est: 'proxima', riesgo: 'medio', dest: 'exportacion', foto: 'arandano-2.jpg', desc: 'Segunda parcela con cosecha prevista para noviembre. Se aceptan reservas.' },
  { i: 4, cultivo: 'Mango Kent', cant: 30000, precio: 2.4, est: 'proxima', riesgo: 'medio', dest: 'exportacion', foto: 'mango-1.jpg', desc: 'Inicio de cosecha estimado para noviembre. Riesgo medio por las anomalías cálidas de El Niño en la costa norte.' },
  { i: 4, cultivo: 'Mango Edward', cant: 8000, precio: 1.8, est: 'proxima', riesgo: 'medio', dest: 'local', foto: 'mango-2.jpg', desc: 'Para mercado nacional y procesadoras de pulpa. Cosecha desde fines de noviembre.' },
  { i: 5, cultivo: 'Papa nativa', cant: 5000, precio: 2.8, est: 'disponible', riesgo: 'medio', dest: 'local', foto: 'papa-1.jpg', desc: 'Mezcla de variedades nativas de altura (qompis, imilla negra). Seleccionada en sacos de 50 kg.' },
  { i: 6, cultivo: 'Papa amarilla tumbay', cant: 12000, precio: 1.9, est: 'disponible', riesgo: 'medio', dest: 'local', foto: 'papa-2.jpg', desc: 'Papa amarilla de primera, calibre uniforme. Entrega en el Mercado Mayorista de Huancayo o en chacra.' },
  { i: 7, cultivo: 'Uva Red Globe', cant: 15000, precio: 4.2, est: 'proxima', riesgo: 'bajo', dest: 'exportacion', foto: 'uva-1.jpg', desc: 'Racimos de 600 a 800 g, grados Brix sobre 16. Cosecha estimada a partir de noviembre.' },
  { i: 8, cultivo: 'Kiwicha', cant: 2400, precio: 7.5, est: 'disponible', riesgo: 'bajo', dest: 'local', foto: 'quinua-1.jpg', desc: 'Grano limpio y venteado del valle del Colca, en sacos de 25 kg.' },
  { i: 9, cultivo: 'Banano orgánico', cant: 20000, precio: 1.6, est: 'en_cosecha', riesgo: 'medio', dest: 'exportacion', foto: 'banano-1.jpg', desc: 'Variedad Cavendish con certificación orgánica en trámite. Cajas de 18,14 kg, cosecha semanal.' },
  { i: 10, cultivo: 'Cebolla roja', cant: 40000, precio: 1.1, est: 'en_cosecha', riesgo: 'bajo', dest: 'local', foto: 'cebolla-1.jpg', desc: 'Cebolla roja arequipeña de calibre mediano a grande, curada en campo. Mallas de 25 kg.' },
  { i: 10, cultivo: 'Cebolla roja de exportación', cant: 18000, precio: 1.5, est: 'disponible', riesgo: 'bajo', dest: 'exportacion', foto: 'cebolla-2.jpg', desc: 'Selección calibre 3 y 4 para exportación, embalaje a pedido del comprador.' },
  { i: 11, cultivo: 'Jengibre fresco', cant: 9000, precio: 4.8, est: 'en_cosecha', riesgo: 'bajo', dest: 'exportacion', foto: 'jengibre-1.jpg', desc: 'Rizoma de 9 meses, lavado y seleccionado. Cajas de 13,6 kg.' },
  { i: 11, cultivo: 'Jengibre para industria', cant: 5000, precio: 2.9, est: 'disponible', riesgo: 'bajo', dest: 'local', foto: 'jengibre-2.jpg', desc: 'Rizoma de segunda para deshidratado, extractos e infusiones.' },
  { i: 12, cultivo: 'Mandarina W. Murcott', cant: 14000, precio: 2.3, est: 'en_cosecha', riesgo: 'bajo', dest: 'exportacion', foto: 'mandarina-1.jpg', desc: 'Fruta sin semilla, calibre 1 a 3. Empaque en planta certificada de Huaral.' },
  { i: 12, cultivo: 'Mandarina Satsuma', cant: 6000, precio: 1.7, est: 'disponible', riesgo: 'bajo', dest: 'local', foto: 'mandarina-2.jpg', desc: 'Para mercado mayorista y jugueras, en jabas de 20 kg.' },
  { i: 13, cultivo: 'Alcachofa sin espinas', cant: 11000, precio: 3.0, est: 'proxima', riesgo: 'bajo', dest: 'exportacion', foto: 'alcachofa-1.jpg', desc: 'Variedad Lorca para conserva. Cosecha desde octubre, acopio en planta de Chincha.' },
  { i: 14, cultivo: 'Café especial lavado', cant: 2800, precio: 19.5, est: 'disponible', riesgo: 'bajo', dest: 'exportacion', foto: 'cafe-1.jpg', desc: 'Caturra y bourbon de 1 700 m s. n. m., taza 85 puntos. Lotes pequeños para tostadores.' },
]
const COMPRADORES = [
  ['Andrea Torres Villanueva', 'empresa', false], ['Miguel Ángel Rivas Cornejo', 'exportador', true], ['Lucía Benavides Ormeño', 'natural', false],
  ['Jorge Luis Castañeda Rey', 'exportador', true], ['Patricia Huertas Molina', 'empresa', false], ['Renzo Alvarado Pacheco', 'empresa', false],
  ['Sofía Delgado Arana', 'natural', false], ['Óscar Villena Campos', 'exportador', true], ['Karina Zegarra Lizárraga', 'empresa', false],
  ['Álvaro Montoya Rospigliosi', 'exportador', true], ['Diana Palomino Cáceres', 'natural', false], ['Héctor Nakamura Flores', 'empresa', false],
  ['Verónica Ascencio Ruiz', 'empresa', false], ['Gustavo Lecca Núñez', 'exportador', true], ['Milagros Quiroz Durand', 'natural', false],
  ['Ricardo Solís Arévalo', 'empresa', false], ['Fiorella Chirinos Vega', 'natural', false], ['Eduardo Pflücker Bustamante', 'exportador', true],
  ['Claudia Mendoza Aguirre', 'empresa', false], ['Raúl Gamarra Ttito', 'natural', false],
]
const DIRECCIONES = ['Av. Nicolás Ayllón 4570, Ate, Lima', 'Calle Los Pinos 214, Víctor Larco Herrera, Trujillo', 'Av. Ejército 1205, Yanahuara, Arequipa', 'Terminal de carga, Av. Elmer Faucett 2851, Callao', 'Jr. Huallaga 780, Huancayo, Junín', 'Av. Sánchez Cerro 1450, Piura', 'Mercado Mayorista de Lima, Santa Anita, puesto 3-112', 'Parque Industrial, Mz. B Lt. 12, Chincha Alta, Ica']
// [comprador, lote, cantidad, estado final, estrellas, comentario]; "calificado" = recibido + calificación del comprador
const PEDIDOS = [
  [1, 0, 3000, 'calificado', 5, 'Fruta pareja y bien empacada, llegó a planta sin daños. Volveremos a comprar en la próxima campaña.'],
  [3, 4, 1200, 'calificado', 5, 'Excelente condición y cadena de frío impecable. Muy buena coordinación con la productora.'],
  [0, 9, 2000, 'calificado', 4, 'Buen calibre. La entrega se retrasó un día por el transporte, pero la calidad fue la ofrecida.'],
  [7, 2, 800, 'calificado', 5, 'Café con humedad correcta y buena taza. Recomendado.'],
  [9, 3, 600, 'calificado', 5, 'Grano bien fermentado, tal cual la descripción.'],
  [4, 13, 5000, 'calificado', 4, 'Cebolla de buena presentación. Algunas mallas con calibre menor, nada grave.'],
  [13, 17, 2500, 'calificado', 5, 'Mandarina dulce y sin semilla, llegó a tiempo al puerto.'],
  [2, 8, 150, 'calificado', 5, 'Compré para mi restaurante; papa de muy buena calidad.'],
  [11, 15, 1500, 'enviado'], [17, 12, 4000, 'enviado'], [5, 18, 800, 'enviado'],
  [16, 11, 120, 'confirmado'], [8, 14, 3000, 'confirmado'],
  [14, 8, 200, 'pendiente'], [19, 16, 400, 'pendiente'], [10, 19, 300, 'pendiente'],
  [6, 1, 500, 'rechazado'],
]

const existentes = await api('GET', '/auth/v1/admin/users?per_page=1000')
const previos = new Map(existentes.users.filter(u => u.email?.endsWith('.ejemplo@example.com')).map(u => [u.email, u.id]))
if (previos.size) {
  const ids = [...previos.values()].join(',')
  const conLotes = await api('GET', `/rest/v1/lotes?select=id&productor_id=in.(${ids})&limit=1`)
  if (conLotes.length) { console.log('Ya hay lotes de ejemplo cargados; no se crea nada.'); process.exit(0) }
  console.log('Reanudando con', previos.size, 'usuarios ya creados')
}

const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(' ').slice(0, 2).join('.')
async function crearUsuario(nombre, meta) {
  const email = `${slug(nombre)}.ejemplo@example.com`, password = crypto.randomBytes(18).toString('base64url')
  if (previos.has(email)) {
    await api('PUT', `/auth/v1/admin/users/${previos.get(email)}`, { body: { password } })
    return { id: previos.get(email), email, password, nombre }
  }
  const u = await api('POST', '/auth/v1/admin/users', { body: { email, password, email_confirm: true, user_metadata: { nombre_completo: nombre, ...meta } } })
  return { id: u.id, email, password, nombre }
}
const tokens = new Map()
async function token(u) {
  if (!tokens.has(u.id)) { tokens.set(u.id, (await api('POST', '/auth/v1/token?grant_type=password', { key: ANON, token: ANON, body: { email: u.email, password: u.password } })).access_token); await sleep(1500) }
  return tokens.get(u.id)
}
const rpc = async (u, fn, body) => api('POST', `/rest/v1/rpc/${fn}`, { key: ANON, token: await token(u), body })

const productores = []
for (const p of PRODUCTORES) productores.push(await crearUsuario(p.n, { rol: 'productor', region: p.r, cultivo_principal: p.c }))
console.log('Productores:', productores.length)
const compradores = []
for (const [n, tipo, exporta] of COMPRADORES) compradores.push(await crearUsuario(n, { rol: 'comprador', tipo_comprador: tipo, destino_exportacion: String(exporta) }))
console.log('Compradores:', compradores.length)

const lotes = []
for (const [k, l] of LOTES.entries()) {
  const prod = productores[l.i], meta = PRODUCTORES[l.i]
  const creado = new Date(Date.now() - (2 + ((k * 7) % 24)) * 86400000 - k * 3600000).toISOString()
  const [lote] = await api('POST', '/rest/v1/lotes', { headers: { Prefer: 'return=representation' }, body: {
    productor_id: prod.id, cultivo: l.cultivo, region: meta.r, provincia: meta.p, distrito: meta.d, cantidad_disponible: l.cant, unidad: 'kg',
    precio_unidad: l.precio, estado_cosecha: l.est, nivel_riesgo: l.riesgo, destino: l.dest, descripcion: MARCA + l.desc, creado_en: creado, borrador: true } })
  const ruta = `${prod.id}/${lote.id}/${crypto.randomUUID()}.jpg`
  await api('POST', `/storage/v1/object/fotos-lotes/${ruta}`, { raw: true, body: fs.readFileSync(path.join(FOTOS, l.foto)), headers: { 'Content-Type': 'image/jpeg' } })
  const [publicado] = await api('PATCH', `/rest/v1/lotes?id=eq.${lote.id}`, { headers: { Prefer: 'return=representation' }, body: { fotos: [ruta], borrador: false } })
  lotes.push({ ...publicado, productor: prod })
}
console.log('Lotes:', lotes.length)

const ORDEN = ['confirmado', 'enviado', 'recibido']
for (const [c, li, cant, final, estrellas, comentario] of PEDIDOS) {
  const comprador = compradores[c], lote = lotes[li]
  const id = await rpc(comprador, 'crear_pedido', { p_lote_id: lote.id, p_cantidad: cant, p_direccion_entrega: DIRECCIONES[c % DIRECCIONES.length], p_idempotencia: crypto.randomUUID(), p_precio_esperado: Number(lote.precio_unidad) })
  if (final === 'rechazado') { await rpc(lote.productor, 'cambiar_estado_pedido', { p_pedido_id: id, p_estado: 'rechazado', p_motivo: 'Ese volumen ya está comprometido con otro cliente esta semana.' }); continue }
  for (const estado of ORDEN.slice(0, ORDEN.indexOf(final === 'calificado' ? 'recibido' : final) + 1)) {
    const actor = ['confirmado', 'enviado'].includes(estado) ? lote.productor : comprador
    await rpc(actor, 'cambiar_estado_pedido', { p_pedido_id: id, p_estado: estado })
  }
  // Solo califica el comprador: queda oculta (doble ciego) hasta que el productor califique o venza el plazo.
  if (final === 'calificado') await rpc(comprador, 'calificar_pedido', { p_pedido_id: id, p_estrellas: estrellas, p_comentario: comentario })
  console.log('Pedido', lote.cultivo, '→', final)
}
console.log('Listo.')
