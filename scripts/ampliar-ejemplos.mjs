// Amplía los datos de EJEMPLO (después de cargar-ejemplos.mjs): 5 productores y 10 lotes más,
// perfil completo de finca y foto referencial para los 20 productores, y reseñas publicadas
// (comprador y productor se califican con los RPC reales, así el doble ciego las libera).
// Uso: node scripts/ampliar-ejemplos.mjs <repo> <carpeta con retratos/ y lotes/>
// Todo sigue marcado como ejemplo: correos *.ejemplo@example.com y lotes con "[Ejemplo] ".
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

// Perfil de finca de los 15 productores originales (mismo orden que cargar-ejemplos.mjs) y de los 5 nuevos.
// Coordenadas aproximadas dentro del distrito de cada uno; foto = id de Pexels (ver docs/creditos-fotos-ejemplo.md).
const PRODUCTORES = [
  { n: 'Rosa Huamán Quispe', foto: '5529606', finca: 'Fundo Santa Rosa', ha: 12, anios: 18, alt: 60, lat: -8.5302, lon: -78.6655, meses: [3, 4, 5, 6, 7, 8], cap: 20000, pr: ['riego_tecnificado', 'trazabilidad', 'manejo_integrado_plagas'], en: ['puesto_en_planta', 'recojo_en_chacra'], as: null, sobre: 'Somos una familia que cultiva palta Hass y espárrago en el valle de Virú desde hace casi veinte años. Regamos por goteo y cosechamos por calibre para que cada jaba llegue pareja a la planta de empaque.' },
  { n: 'Julio César Paredes Tello', foto: '29799580', finca: 'Finca El Mirador', ha: 6, anios: 25, alt: 1150, lat: -6.1021, lon: -76.9046, meses: [4, 5, 6, 7], cap: 3000, pr: ['cosecha_manual', 'organico', 'trazabilidad'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: 'Asociación de caficultores del Alto Mayo', sobre: 'Cafés de altura bajo sombra de guabas y plátano. Cosechamos solo cereza madura, fermentamos en tanque y secamos en marquesina para cuidar la taza.' },
  { n: 'Elmer Tapullima Sangama', foto: '31097988', finca: 'Chacra Nueva Esperanza', ha: 8, anios: 15, alt: 560, lat: -8.4471, lon: -76.4529, meses: [3, 4, 5, 6, 10, 11], cap: 2500, pr: ['organico', 'cosecha_manual', 'comercio_justo'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: 'Cooperativa cacaotera del Huallaga', sobre: 'Dejamos la coca hace quince años por el cacao fino de aroma. Fermentamos seis días en cajones de madera y secamos al sol en tendales.' },
  { n: 'Carmen Rojas Salazar', foto: '36040318', finca: 'Agrícola Las Lomas', ha: 15, anios: 9, alt: 95, lat: -8.0801, lon: -78.9487, meses: [8, 9, 10, 11, 12], cap: 12000, pr: ['riego_tecnificado', 'trazabilidad', 'manejo_integrado_plagas'], en: ['puesto_en_planta', 'puesto_en_puerto'], as: null, sobre: 'Arándanos de las variedades Biloxi y Ventura en el valle de Moche. Cosechamos de madrugada y enfriamos en campo antes de despachar a planta.' },
  { n: 'Wilfredo Chunga Yarlequé', foto: '33365127', finca: 'Fundo Los Algarrobos', ha: 20, anios: 30, alt: 75, lat: -4.9180, lon: -80.3315, meses: [11, 12, 1, 2, 3], cap: 35000, pr: ['riego_tecnificado', 'cosecha_manual'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: 'Asociación de productores de mango de Tambogrande', sobre: 'Mango Kent y Edward y limón sutil en San Lorenzo. Treinta campañas nos enseñaron a cosechar en el punto justo para exportación y mercado nacional.' },
  { n: 'Nicolasa Mamani Apaza', foto: '19822273', finca: 'Chacra Pampa Grande', ha: 3, anios: 35, alt: 3860, lat: -16.0791, lon: -69.6302, meses: [4, 5, 6], cap: 4000, pr: ['semilla_nativa', 'agua_de_lluvia', 'cosecha_manual'], en: ['recojo_en_chacra', 'entrega_en_mercado'], as: null, sobre: 'Cultivamos papas nativas como lo hacían mis abuelos, en rotación con quinua y habas. Seleccionamos a mano y entregamos en sacos de 50 kg.' },
  { n: 'Fidel Ccori Huaynate', foto: '16957832', finca: 'Chacra Santa Ana', ha: 7, anios: 22, alt: 3290, lat: -12.0105, lon: -75.2733, meses: [4, 5, 6, 7], cap: 10000, pr: ['semilla_nativa', 'manejo_integrado_plagas'], en: ['entrega_en_mercado', 'recojo_en_chacra'], as: null, sobre: 'Papa amarilla tumbay y papa blanca del valle del Mantaro. Llevamos nuestra cosecha al mercado mayorista de Huancayo cada semana.' },
  { n: 'Martha Quispe Hernández', foto: '28278824', finca: 'Viñedo San Martín', ha: 18, anios: 20, alt: 380, lat: -14.1802, lon: -75.7031, meses: [11, 12, 1, 2, 3, 4, 5], cap: 18000, pr: ['riego_tecnificado', 'trazabilidad'], en: ['puesto_en_planta', 'puesto_en_puerto'], as: null, sobre: 'Uva Red Globe y granada Wonderful en Santiago, Ica. Trabajamos con riego por goteo y registros por parcela para exportar con trazabilidad completa.' },
  { n: 'Teodoro Condori Mayta', foto: '17045111', finca: 'Andenes de Chivay', ha: 4, anios: 40, alt: 3640, lat: -15.6331, lon: -71.5932, meses: [4, 5, 6], cap: 2000, pr: ['semilla_nativa', 'agua_de_lluvia', 'cosecha_manual'], en: ['recojo_en_chacra', 'entrega_en_mercado'], as: 'Comunidad campesina de Chivay', sobre: 'Kiwicha y quinua sembradas en andenes preincas del valle del Colca. Venteamos y limpiamos el grano en la misma comunidad.' },
  { n: 'Luis Alberto Vásquez Silupú', foto: '16957833', finca: 'Fundo El Chilco', ha: 10, anios: 17, alt: 90, lat: -4.8301, lon: -80.6389, meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], cap: 25000, pr: ['organico', 'comercio_justo', 'trazabilidad'], en: ['puesto_en_planta', 'puesto_en_puerto'], as: 'Asociación de bananeros orgánicos del Chira', sobre: 'Banano orgánico Cavendish en el valle del Chira. Cosechamos cada semana del año y empacamos en cajas de 18,14 kg.' },
  { n: 'Gladys Chávez Llerena', foto: '37759647', finca: 'Parcela La Joya', ha: 9, anios: 14, alt: 1270, lat: -16.4830, lon: -72.0891, meses: [8, 9, 10, 11, 12], cap: 40000, pr: ['riego_tecnificado', 'manejo_integrado_plagas'], en: ['recojo_en_chacra', 'entrega_en_mercado'], as: null, sobre: 'Cebolla roja arequipeña en las pampas de Siguas. Curamos en campo y seleccionamos por calibre para mercado nacional y exportación.' },
  { n: 'Hernán Ríos Cárdenas', foto: '7125419', finca: 'Fundo Río Negro', ha: 11, anios: 12, alt: 520, lat: -10.9170, lon: -74.8660, meses: [6, 7, 8, 9, 12, 1, 2, 3], cap: 15000, pr: ['cosecha_manual', 'manejo_integrado_plagas'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: null, sobre: 'Jengibre y piña golden en la selva central. Lavamos y seleccionamos el jengibre en la finca y cosechamos la piña en su punto de azúcar.' },
  { n: 'Yolanda Espinoza Cruz', foto: '16895309', finca: 'Huerta Los Naranjos', ha: 14, anios: 21, alt: 190, lat: -11.4880, lon: -77.2011, meses: [4, 5, 6, 7, 8], cap: 15000, pr: ['riego_tecnificado', 'trazabilidad'], en: ['entrega_en_mercado', 'puesto_en_planta'], as: null, sobre: 'Mandarinas y ají amarillo en el valle de Huaral, a dos horas de Lima. Entregamos en el mercado mayorista o directamente en planta.' },
  { n: 'Rubén Salazar Guzmán', foto: '29892495', finca: 'Fundo San Rubén', ha: 16, anios: 26, alt: 110, lat: -13.4012, lon: -76.1190, meses: [9, 10, 11, 12], cap: 20000, pr: ['riego_tecnificado', 'manejo_integrado_plagas', 'trazabilidad'], en: ['puesto_en_planta'], as: null, sobre: 'Alcachofa sin espinas para conserva en Chincha. Coordinamos la cosecha con las plantas conserveras para entregar en el día.' },
  { n: 'Doris Pinedo Guevara', foto: '17836197', finca: 'Finca Las Orquídeas', ha: 5, anios: 11, alt: 1600, lat: -5.6072, lon: -78.9190, meses: [4, 5, 6, 7, 8], cap: 2500, pr: ['organico', 'cosecha_manual', 'comercio_justo'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: 'Asociación de mujeres cafetaleras de Huabal', sobre: 'Café especial lavado de Jaén. Somos parte de un grupo de productoras que cuida cada paso, de la cereza al pergamino.' },
  // Nuevos
  { n: 'Eusebia Choque Quispe', foto: '17060513', r: 'Puno', p: 'San Román', d: 'Cabana', c: 'Quinua', finca: 'Chacra Q\'ello', ha: 5, anios: 28, alt: 3900, lat: -15.6352, lon: -70.3162, meses: [4, 5, 6], cap: 3000, pr: ['semilla_nativa', 'agua_de_lluvia', 'organico'], en: ['recojo_en_chacra', 'entrega_en_mercado'], as: 'Asociación de quinueros de Cabana', sobre: 'Quinua blanca y de colores en el altiplano. La lavamos y seleccionamos a mano para quitar la saponina.' },
  { n: 'Abel Huamaní Ccente', foto: '16957837', r: 'Ayacucho', p: 'Huamanga', d: 'Tambillo', c: 'Maíz morado', finca: 'Chacra Wayllapampa', ha: 4, anios: 33, alt: 3050, lat: -13.1901, lon: -74.1041, meses: [5, 6, 7], cap: 3000, pr: ['semilla_nativa', 'agua_de_lluvia', 'cosecha_manual'], en: ['recojo_en_chacra', 'entrega_en_mercado'], as: null, sobre: 'Maíz morado de semilla propia, secado al sol en la chacra. Lo vendemos en mazorca entera para chicha y colorantes.' },
  { n: 'Santos Chuquilín Tasilla', foto: '16957834', r: 'Cajamarca', p: 'San Marcos', d: 'Pedro Gálvez', c: 'Aguaymanto', finca: 'Huerto El Molino', ha: 3, anios: 8, alt: 2250, lat: -7.3290, lon: -78.1632, meses: [3, 4, 5, 6, 7, 8], cap: 1500, pr: ['organico', 'cosecha_manual'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: null, sobre: 'Aguaymanto de los valles de Cajamarca. Cosechamos el fruto con su cáliz y lo seleccionamos por calibre en la chacra.' },
  { n: 'Marleni Gutiérrez Ore', foto: '36040338', r: 'Junín', p: 'Satipo', d: 'Pangoa', c: 'Maracuyá', finca: 'Parcela Santa Marleni', ha: 6, anios: 10, alt: 800, lat: -11.4201, lon: -74.4812, meses: [2, 3, 4, 5, 6, 7, 8, 9], cap: 12000, pr: ['cosecha_manual', 'manejo_integrado_plagas'], en: ['recojo_en_chacra', 'entrega_en_mercado'], as: null, sobre: 'Maracuyá amarillo en espaldera en la selva central. Cosechamos fruta caída del día para jugueras y la industria de pulpa.' },
  { n: 'Segundo Tuanama Sangama', foto: '16957838', r: 'San Martín', p: 'Lamas', d: 'Tabalosos', c: 'Sacha inchi', finca: 'Chacra Pucayacu', ha: 7, anios: 6, alt: 520, lat: -6.3861, lon: -76.6270, meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], cap: 2000, pr: ['organico', 'cosecha_manual', 'comercio_justo'], en: ['recojo_en_chacra', 'puesto_en_planta'], as: null, sobre: 'Sacha inchi asociado con plátano y árboles nativos. Cosechamos las cápsulas secas todo el año y descascaramos a pedido.' },
]
// i = índice en PRODUCTORES
const LOTES = [
  { i: 0, cultivo: 'Espárrago verde', cant: 9000, precio: 6.8, est: 'disponible', riesgo: 'bajo', dest: 'exportacion', foto: 'esparrago-1.jpg', desc: 'Turiones de 18 a 22 cm y calibre 10 a 16 mm. Se cosecha a diario y se enfría en campo antes del despacho.' },
  { i: 7, cultivo: 'Granada Wonderful', cant: 12000, precio: 4.5, antes: 5.2, est: 'en_cosecha', riesgo: 'bajo', dest: 'exportacion', foto: 'granada-1.jpg', desc: 'Fruta de 350 a 500 g con arilo rojo intenso. Empaque en cajas de 4 kg en planta certificada.' },
  { i: 4, cultivo: 'Limón sutil', cant: 8000, precio: 2.2, est: 'disponible', riesgo: 'medio', dest: 'local', foto: 'limon-1.jpg', desc: 'Limón ácido de Tambogrande, mucho jugo y cáscara delgada. Cosecha semanal en sacos de 50 kg.' },
  { i: 12, cultivo: 'Ají amarillo', cant: 3500, precio: 5.6, antes: 6.5, est: 'disponible', riesgo: 'bajo', dest: 'local', foto: 'aji-amarillo-1.jpg', desc: 'Ají amarillo fresco de 12 a 15 cm, cosechado a mano. Ideal para restaurantes y procesadoras.' },
  { i: 11, cultivo: 'Piña golden', cant: 20000, precio: 1.9, est: 'en_cosecha', riesgo: 'medio', dest: 'local', foto: 'pina-1.jpg', desc: 'Piña MD-2 de 1,5 a 2 kg, dulce y aromática. Cosecha continua en la selva central.' },
  { i: 15, cultivo: 'Quinua blanca', cant: 6000, precio: 6.9, est: 'disponible', riesgo: 'bajo', dest: 'exportacion', foto: 'quinua-1.jpg', desc: 'Quinua de altura lavada y seleccionada, libre de saponina. Sacos de 25 kg.' },
  { i: 16, cultivo: 'Maíz morado', cant: 4000, precio: 3.8, antes: 4.4, est: 'disponible', riesgo: 'bajo', dest: 'local', foto: 'maiz-morado-1.jpg', desc: 'Mazorca entera seca y de color intenso. Para chicha morada, mazamorra y colorantes naturales.' },
  { i: 17, cultivo: 'Aguaymanto fresco', cant: 1500, precio: 8.5, est: 'en_cosecha', riesgo: 'bajo', dest: 'exportacion', foto: 'aguaymanto-1.jpg', desc: 'Fruto con cáliz, calibre 18 a 22 mm. Cosecha manual y selección en chacra.' },
  { i: 18, cultivo: 'Maracuyá amarillo', cant: 10000, precio: 2.6, est: 'en_cosecha', riesgo: 'medio', dest: 'local', foto: 'maracuya-1.jpg', desc: 'Fruta de 120 a 180 g con alto rendimiento de pulpa. Para jugueras e industria.' },
  { i: 19, cultivo: 'Sacha inchi', cant: 2500, precio: 12, est: 'disponible', riesgo: 'bajo', dest: 'exportacion', foto: 'sacha-inchi-1.jpg', desc: 'Semilla seca con cápsula, humedad por debajo de 8 %. Descascarado a pedido.' },
]
// Reseñas por productor: estrellas que pone el comprador (el orden reparte compradores y lotes).
const ESTRELLAS = [[5, 5, 4, 5, 5], [5, 4, 5, 5], [5, 5, 4, 4], [5, 5, 5, 4, 5, 5], [4, 5, 5, 3], [5, 5, 5], [4, 4, 5], [5, 5, 4, 5, 5],
  [5, 5, 5], [5, 4, 4, 5], [4, 5, 4, 5], [5, 4, 5], [5, 5, 5, 4, 5], [4, 3, 5], [5, 5, 5, 5], [5, 5, 4], [5, 4, 5], [5, 5], [4, 5, 5], [5]]
const GENERALES = {
  5: ['Todo conforme: cantidad, calibre y presentación. Volveremos a comprar.', 'Llegó en el día acordado y bien embalado. Muy recomendado.', 'Calidad pareja en todo el lote; se nota el cuidado en la cosecha.',
    'Excelente trato desde el pedido hasta la entrega. Nuestros clientes quedaron contentos.', 'Segunda compra y otra vez impecable. Da gusto trabajar así.', 'Producto tal como en las fotos y peso exacto en la balanza.',
    'Muy buena comunicación: nos avisaron cada paso del despacho.', 'Fresco y bien seleccionado. Lo recomendamos a otros compradores.'],
  4: ['Buena calidad en general; algunas unidades más pequeñas de lo esperado.', 'Producto bueno. La entrega se demoró un día, pero avisaron a tiempo.',
    'Cumplió con lo ofrecido. Mejoraría el embalaje para viajes largos.', 'Buen producto y precio justo. El despacho tardó un poco más de lo acordado.'],
  3: ['La calidad estuvo bien, pero hubo diferencias en el peso que se resolvieron conversando.', 'Producto aceptable; parte del lote llegó con golpes por el transporte.'],
}
const DETALLE = [['Palta', 'Materia seca en rango y buena maduración en cámara.'], ['Espárrago', 'Turiones rectos y de calibre parejo.'], ['Café', 'Buena taza en la catación y humedad correcta.'],
  ['Cacao', 'Fermentación pareja y muy buen aroma.'], ['Arándano', 'Firmeza y calibre muy buenos; la cadena de frío, impecable.'], ['Mango', 'Buen color y dulzor.'],
  ['Limón', 'Mucho jugo y cáscara delgada.'], ['Papa', 'Sana, sin brotes y bien seleccionada.'], ['Uva', 'Racimos compactos y buen grado Brix.'], ['Granada', 'Arilos de color intenso.'],
  ['Kiwicha', 'Grano limpio, sin impurezas.'], ['Quinua', 'Grano limpio y sin saponina.'], ['Banano', 'Dedos parejos y buena vida en anaquel.'], ['Cebolla', 'Bien curada y sin humedad.'],
  ['Jengibre', 'Rizomas firmes y limpios.'], ['Piña', 'Dulce y aromática.'], ['Mandarina', 'Jugosa y sin semilla.'], ['Ají', 'Color intenso y buen picor.'],
  ['Alcachofa', 'Corazones tiernos, ideales para conserva.'], ['Maíz', 'Mazorcas de buen color para chicha morada.'], ['Aguaymanto', 'Frutos dulces y con el cáliz entero.'],
  ['Maracuyá', 'Buen rendimiento de pulpa.'], ['Sacha', 'Semilla bien seca y limpia.']]
const AL_COMPRADOR = ['Pago puntual y buena comunicación.', 'Coordinó el recojo sin problemas. Buen cliente.', 'Muy claro con lo que necesitaba. Da gusto venderle.', 'Cumplió con lo acordado y recibió a tiempo.']
const DIRECCIONES = ['Av. Nicolás Ayllón 4570, Ate, Lima', 'Calle Los Pinos 214, Víctor Larco Herrera, Trujillo', 'Av. Ejército 1205, Yanahuara, Arequipa', 'Terminal de carga, Av. Elmer Faucett 2851, Callao', 'Jr. Huallaga 780, Huancayo, Junín', 'Av. Sánchez Cerro 1450, Piura', 'Mercado Mayorista de Lima, Santa Anita, puesto 3-112', 'Parque Industrial, Mz. B Lt. 12, Chincha Alta, Ica']

const usuarios = (await api('GET', '/auth/v1/admin/users?per_page=1000')).users.filter(u => u.email?.endsWith('.ejemplo@example.com'))
const porCorreo = new Map(usuarios.map(u => [u.email, u.id]))
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(' ').slice(0, 2).join('.')
async function cuenta(nombre, meta) {
  const email = `${slug(nombre)}.ejemplo@example.com`, password = crypto.randomBytes(18).toString('base64url')
  if (porCorreo.has(email)) { await api('PUT', `/auth/v1/admin/users/${porCorreo.get(email)}`, { body: { password } }); return { id: porCorreo.get(email), email, password, nombre } }
  if (!meta) throw new Error(`Falta la cuenta de ejemplo ${email}: corre antes cargar-ejemplos.mjs`)
  const u = await api('POST', '/auth/v1/admin/users', { body: { email, password, email_confirm: true, user_metadata: { nombre_completo: nombre, ...meta } } })
  return { id: u.id, email, password, nombre }
}
const tokens = new Map()
async function token(u) {
  if (!tokens.has(u.id)) { tokens.set(u.id, (await api('POST', '/auth/v1/token?grant_type=password', { key: ANON, token: ANON, body: { email: u.email, password: u.password } })).access_token); await sleep(1200) }
  return tokens.get(u.id)
}
const rpc = async (u, fn, body) => api('POST', `/rest/v1/rpc/${fn}`, { key: ANON, token: await token(u), body })

// 1. Productores (los 15 existentes y 5 nuevos) con perfil de finca y foto.
const productores = []
for (const p of PRODUCTORES) productores.push(await cuenta(p.n, p.r && { rol: 'productor', region: p.r, cultivo_principal: p.c }))
for (const [k, p] of PRODUCTORES.entries()) {
  const prod = productores[k]
  const [perfil] = await api('GET', `/rest/v1/perfiles?select=foto&id=eq.${prod.id}`)
  const datos = { finca: p.finca, hectareas: p.ha, anios_experiencia: p.anios, altitud_msnm: p.alt, latitud: p.lat, longitud: p.lon, sobre_mi: p.sobre, practicas: p.pr, meses_cosecha: p.meses, capacidad_mensual_kg: p.cap, entregas: p.en, asociacion: p.as }
  if (!perfil.foto) {
    const ruta = `${prod.id}/${crypto.randomUUID()}.jpg`
    await api('POST', `/storage/v1/object/fotos-perfil/${ruta}`, { raw: true, body: fs.readFileSync(path.join(FOTOS, 'retratos', `${p.foto}.jpg`)), headers: { 'Content-Type': 'image/jpeg' } })
    datos.foto = ruta
  }
  await api('PATCH', `/rest/v1/perfiles?id=eq.${prod.id}`, { body: datos })
}
console.log('Perfiles de productor completos:', productores.length)

// 2. Lotes nuevos (se saltan si ya existen).
const idsProd = productores.map(p => p.id).join(',')
const existentes = await api('GET', `/rest/v1/lotes?select=id,cultivo,productor_id&productor_id=in.(${idsProd})&descripcion=like.*Ejemplo*`)
for (const [k, l] of LOTES.entries()) {
  const prod = productores[l.i], meta = PRODUCTORES[l.i]
  if (existentes.some(e => e.cultivo === l.cultivo && e.productor_id === prod.id)) continue
  const ubic = meta.r ? meta : (await api('GET', `/rest/v1/lotes?select=region,provincia,distrito&productor_id=eq.${prod.id}&limit=1`))[0]
  const creado = new Date(Date.now() - (1 + ((k * 5) % 12)) * 86400000 - k * 3600000).toISOString()
  const [lote] = await api('POST', '/rest/v1/lotes', { headers: { Prefer: 'return=representation' }, body: {
    productor_id: prod.id, cultivo: l.cultivo, region: ubic.r ?? ubic.region, provincia: ubic.p ?? ubic.provincia, distrito: ubic.d ?? ubic.distrito, cantidad_disponible: l.cant, unidad: 'kg',
    precio_unidad: l.precio, precio_anterior: l.antes ?? null, estado_cosecha: l.est, nivel_riesgo: l.riesgo, destino: l.dest, descripcion: MARCA + l.desc, creado_en: creado, borrador: true } })
  const ruta = `${prod.id}/${lote.id}/${crypto.randomUUID()}.jpg`
  await api('POST', `/storage/v1/object/fotos-lotes/${ruta}`, { raw: true, body: fs.readFileSync(path.join(FOTOS, 'lotes', l.foto)), headers: { 'Content-Type': 'image/jpeg' } })
  await api('PATCH', `/rest/v1/lotes?id=eq.${lote.id}`, { body: { fotos: [ruta], borrador: false } })
  console.log('Lote nuevo:', l.cultivo)
}

// 3. Reseñas publicadas: pedido → confirmado → enviado → recibido, y ambas partes califican.
const compradores = []
for (const u of usuarios) { const [p] = await api('GET', `/rest/v1/perfiles?select=rol,nombre_completo&id=eq.${u.id}`); if (p?.rol === 'comprador') compradores.push({ id: u.id, email: u.email, nombre: p.nombre_completo }) }
const yaHay = await api('GET', `/rest/v1/calificaciones?select=id&rol_calificador=eq.productor&calificado_por=in.(${idsProd})&limit=20`)
if (yaHay.length >= 15) { console.log('Las reseñas de ejemplo ya estaban cargadas.'); process.exit(0) }
for (const c of compradores) Object.assign(c, await cuenta(c.nombre))

// Las compras anteriores que solo calificó el comprador se publican cuando el productor califica.
const previos = await api('GET', `/rest/v1/pedidos?select=id,productor_id&estado=in.(recibido,calificado)&productor_id=in.(${idsProd})`)
for (const pe of previos) {
  const prod = productores.find(p => p.id === pe.productor_id)
  await rpc(prod, 'calificar_pedido', { p_pedido_id: pe.id, p_estrellas: 5, p_comentario: AL_COMPRADOR[0] }).catch(e => console.log('  (previo omitido)', e.message.slice(0, 80)))
}
let n = 0
const lotes = await api('GET', `/rest/v1/catalogo_lotes?select=id,cultivo,productor_id,precio_unidad,cantidad_disponible&productor_id=in.(${idsProd})`)
for (const [k, estrellas] of ESTRELLAS.entries()) {
  const prod = productores[k], suyos = lotes.filter(l => l.productor_id === prod.id)
  if (!suyos.length) continue
  for (const [j, e] of estrellas.entries()) {
    const lote = suyos[j % suyos.length], comprador = compradores[(k * 3 + j * 7) % compradores.length]
    const cant = Math.max(50, Math.round(Math.min(lote.cantidad_disponible * 0.04, 900) / 10) * 10)
    const id = await rpc(comprador, 'crear_pedido', { p_lote_id: lote.id, p_cantidad: cant, p_direccion_entrega: DIRECCIONES[(k + j) % DIRECCIONES.length], p_idempotencia: crypto.randomUUID(), p_precio_esperado: Number(lote.precio_unidad) })
    lote.cantidad_disponible -= cant
    await rpc(prod, 'cambiar_estado_pedido', { p_pedido_id: id, p_estado: 'confirmado' })
    await rpc(prod, 'cambiar_estado_pedido', { p_pedido_id: id, p_estado: 'enviado' })
    await rpc(comprador, 'cambiar_estado_pedido', { p_pedido_id: id, p_estado: 'recibido' })
    const base = GENERALES[e][(k + j * 3) % GENERALES[e].length], extra = DETALLE.find(([clave]) => lote.cultivo.startsWith(clave))?.[1]
    await rpc(comprador, 'calificar_pedido', { p_pedido_id: id, p_estrellas: e, p_comentario: e >= 4 && extra && j % 2 === 0 ? `${extra} ${base}` : base })
    await rpc(prod, 'calificar_pedido', { p_pedido_id: id, p_estrellas: 5 - (j % 3 === 2 ? 1 : 0), p_comentario: AL_COMPRADOR[(k + j) % AL_COMPRADOR.length] })
    n++
  }
  console.log(prod.nombre, '→', estrellas.length, 'reseñas')
}
console.log('Reseñas nuevas:', n, '· Listo.')
