// Valida el catálogo (/marketplace) y su scroll infinito contra la base de datos.
// Uso: node --env-file=.env.local scripts/qa/validar-catalogo.mjs <url-base>
//   <url-base>: http://localhost:3100 (build local) o https://agrosignal.vercel.app
// Sale con código 1 si falla cualquier comprobación.
import { abrirNavegador, esperar } from './navegador.mjs'

const BASE = (process.argv[2] || '').replace(/\/$/, '')
if (!/^https?:\/\//.test(BASE)) { console.error('Indica la URL base, p. ej. http://localhost:3100'); process.exit(2) }
const { SUPABASE_PROJECT_REF: ref, SUPABASE_ACCESS_TOKEN: token } = process.env
if (!ref || !token) { console.error('Faltan SUPABASE_PROJECT_REF y SUPABASE_ACCESS_TOKEN (usa --env-file=.env.local).'); process.exit(2) }

let fallas = 0
const ok = (cond, texto) => { console.log(`${cond ? '✔' : '✘'} ${texto}`); if (!cond) fallas++ }

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) })
  if (!r.ok) throw new Error(`Supabase SQL ${r.status}: ${await r.text()}`)
  return r.json()
}

// 1. Rutas principales responden 200.
for (const ruta of ['/', '/marketplace', '/marketplace/precios', '/ayuda', '/contacto', '/login']) {
  const r = await fetch(BASE + ruta, { redirect: 'manual' })
  ok(r.status === 200, `GET ${ruta} → ${r.status}`)
}

// 2. El endpoint rechaza cursores y filtros inválidos, y no se guarda en caché.
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')
const [primero] = await sql('select id, creado_en from catalogo_lotes order by creado_en desc, id limit 1')
const cursorOk = primero && b64({ v: 1, orden: 'recientes', creado: new Date(primero.creado_en).toISOString(), id: primero.id })
const api = async q => { const r = await fetch(`${BASE}/api/marketplace?${q}`); return { status: r.status, cache: r.headers.get('cache-control') ?? '' } }
if (cursorOk) {
  const r = await api(`cursor=${cursorOk}`)
  ok(r.status === 200, `API con cursor válido → ${r.status}`)
  ok(/no-store/.test(r.cache), `API sin caché (${r.cache})`)
}
for (const [nombre, q] of [
  ['sin cursor', ''], ['cursor basura', 'cursor=abc'], ['cursor de otro orden', `cursor=${cursorOk}&orden=precio_asc`],
  ['inyección en id', `cursor=${b64({ v: 1, orden: 'recientes', creado: '2026-01-01T00:00:00Z', id: 'x,id.neq.0' })}`],
  ['inyección en fecha', `cursor=${b64({ v: 1, orden: 'recientes', creado: '2026),or(id.neq.0', id: '00000000-0000-0000-0000-000000000000' })}`],
  ['filtro inválido', `sello=9&cursor=${cursorOk}`], ['cursor enorme', `cursor=${'a'.repeat(900)}`],
]) { const r = await api(q); ok(r.status === 400, `API rechaza ${nombre} → ${r.status}`) }

// 3. Scroll infinito: cada orden carga todos los lotes, sin duplicados y en el orden de la base.
const ORDEN_SQL = {
  recientes: 'creado_en desc, id', precio_asc: 'precio_unidad asc, creado_en desc, id',
  precio_desc: 'precio_unidad desc, creado_en desc, id', calificacion: 'productor_promedio desc nulls last, productor_calificaciones desc, creado_en desc, id',
}
const CASOS = [
  ...Object.keys(ORDEN_SQL).map(o => ({ nombre: `orden=${o}`, query: `orden=${o}`, where: 'true', orden: ORDEN_SQL[o] })),
  { nombre: 'sello=3 (filtro)', query: 'sello=3', where: 'nivel_sello = 3', orden: ORDEN_SQL.recientes },
  { nombre: 'sello=9 (filtro inválido se ignora)', query: 'sello=9', where: 'true', orden: ORDEN_SQL.recientes },
  { nombre: 'minimo=abc (filtro inválido se ignora)', query: 'minimo=abc', where: 'true', orden: ORDEN_SQL.recientes },
]
const nav = await abrirNavegador()
try {
  for (const c of CASOS) {
    const esperado = (await sql(`select id from catalogo_lotes where ${c.where} order by ${c.orden}`)).map(r => r.id)
    await nav.ir(`${BASE}/marketplace?${c.query}`)
    let fin = false
    for (let i = 0; i < 40 && !fin; i++) { await nav.js('window.scrollTo(0, document.body.scrollHeight)'); await esperar(1500); fin = await nav.js(`document.body.innerText.includes('Has visto todos los productos')`) }
    const ids = await nav.js(`[...document.querySelectorAll('article h2 a[href^="/marketplace/"]')].map(a => a.getAttribute('href').split('/').pop())`) ?? []
    const error = await nav.js(`!!document.querySelector('#resultados ~ * [role=alert], [aria-busy] [role=alert]')`)
    ok(fin && !error && ids.length === esperado.length && new Set(ids).size === ids.length && JSON.stringify(ids) === JSON.stringify(esperado),
      `Scroll ${c.nombre}: ${ids.length}/${esperado.length} lotes, ${ids.length - new Set(ids).size} duplicados, orden ${JSON.stringify(ids) === JSON.stringify(esperado) ? 'igual' : 'DISTINTO'} a la BD, final ${fin}, error ${error}`)
  }
} finally { await nav.cerrar() }

console.log(fallas ? `\n${fallas} comprobación(es) fallaron.` : '\nTodas las comprobaciones pasaron.')
process.exit(fallas ? 1 : 0)
