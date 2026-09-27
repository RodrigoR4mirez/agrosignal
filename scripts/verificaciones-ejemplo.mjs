// Verificación AgroSignal de EJEMPLO para los lotes marcados "[Ejemplo] ": certificado
// aprobado (nivel 1), vuelo de dron completado (nivel 2) y test de residuos que pasa (nivel 3).
// Un lote queda en nivel 1, otro en nivel 2 y el resto en nivel 3. Los archivos de evidencia
// son un PDF y una imagen generados que dicen "Documento de ejemplo", no fotos ni certificados
// reales. Idempotente: salta los lotes que ya tienen certificados.
// Uso: node scripts/verificaciones-ejemplo.mjs <repo>
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

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
async function subir(bucket, ruta, contenido, tipo) {
  const r = await fetch(`${URL}/storage/v1/object/${bucket}/${ruta}`, { method: 'POST', headers: { apikey: SR, Authorization: `Bearer ${SR}`, 'Content-Type': tipo, 'x-upsert': 'true' }, body: contenido })
  if (!r.ok) throw new Error(`subir ${bucket}/${ruta} → ${r.status} ${await r.text()}`)
}

// Nivel por cultivo; los que no aparecen quedan en 3.
const NIVEL = { 'Papa nativa': 1, 'Maíz morado': 2 }
const KITS = ['Kit rápido de organofosforados y carbamatos', 'Tiras reactivas de inhibición de colinesterasa']
const NOTAS_DRON = [
  'Cobertura completa del lote. Follaje uniforme y sin focos de plaga visibles.',
  'Vuelo a 60 m. Cultivo en buen estado y sin zonas con estrés hídrico.',
  'Se recorrió todo el campo. Linderos claros y riego en buen estado.',
]

// PDF de una página con texto plano (Helvetica), suficiente para el visor del navegador.
function pdf(lineas) {
  const texto = lineas.map((l, i) => `BT /F1 ${i ? 12 : 18} Tf 60 ${740 - i * 26} Td (${l.replace(/[()\\]/g, '\\$&')}) Tj ET`).join('\n')
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(texto, 'latin1')} >>\nstream\n${texto}\nendstream`]
  let out = '%PDF-1.4\n'; const offs = []
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out, 'latin1')); out += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = Buffer.byteLength(out, 'latin1')
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}`
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(out, 'latin1')
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const imagen = (titulo, detalle) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <rect width="1200" height="800" fill="#fdf9f0"/><rect x="40" y="40" width="1120" height="720" rx="32" fill="none" stroke="#133535" stroke-width="3"/>
  <text x="600" y="330" text-anchor="middle" font-family="Helvetica, Arial" font-size="56" fill="#133535">${esc(titulo)}</text>
  <text x="600" y="410" text-anchor="middle" font-family="Helvetica, Arial" font-size="32" fill="#4a2c1d">${esc(detalle)}</text>
  <text x="600" y="520" text-anchor="middle" font-family="Helvetica, Arial" font-size="26" fill="#6f8f4e">Evidencia de ejemplo · AgroSignal</text></svg>`)).jpeg({ quality: 85 }).toBuffer()

const admin = (await api('GET', '/rest/v1/perfiles?select=id&rol=eq.admin&limit=1'))[0]
if (!admin) throw new Error('No hay cuenta admin para firmar las revisiones.')
const lotes = await api('GET', `/rest/v1/lotes?select=id,productor_id,cultivo,region,creado_en&bloqueado=eq.false&descripcion=like.${encodeURIComponent('[Ejemplo]*')}&order=creado_en`)
const conCert = new Set((await api('GET', `/rest/v1/certificados?select=lote_id&lote_id=in.(${lotes.map(l => l.id).join(',')})`)).map(c => c.lote_id))
const perfiles = new Map((await api('GET', `/rest/v1/perfiles?select=id,latitud,longitud&id=in.(${[...new Set(lotes.map(l => l.productor_id))].join(',')})`)).map(p => [p.id, p]))

let hechos = 0
for (const [i, l] of lotes.entries()) {
  if (conCert.has(l.id)) continue
  const nivel = NIVEL[l.cultivo] ?? 3
  const base = new Date(l.creado_en), dia = n => new Date(base.getTime() + n * 3600e3)
  const fecha = d => d.toISOString().slice(0, 10)
  const carpeta = `${l.productor_id}/${l.id}`

  const cert = `${carpeta}/${randomUUID()}.pdf`, numero = `AS-${fecha(base).slice(0, 4)}-${String(1200 + i * 7).padStart(5, '0')}`
  await subir('certificados', cert, pdf(['Documento de ejemplo - AgroSignal', `Lote: ${l.cultivo} (${l.region})`, `Numero: ${numero}`, 'Datos de demostracion. No es un certificado real.']), 'application/pdf')
  await api('POST', '/rest/v1/certificados', { lote_id: l.id, tipo: 'otro', numero, fecha_vencimiento: fecha(new Date(base.getTime() + 365 * 86400e3)), archivo_url: cert,
    estado: 'aprobado', revisado_por: admin.id, creado_en: dia(2).toISOString(), revisado_en: dia(6).toISOString() })

  if (nivel >= 2) {
    const p = perfiles.get(l.productor_id), foto = `${carpeta}/${randomUUID()}.jpg`
    await subir('evidencia-drones', foto, await imagen('Inspección con dron', l.cultivo), 'image/jpeg')
    await api('POST', '/rest/v1/inspecciones_dron', { lote_id: l.id, estado: 'completado', coordenadas_gps: p?.latitud ? `${Number(p.latitud).toFixed(6)}, ${Number(p.longitud).toFixed(6)}` : null,
      fecha_vuelo: fecha(dia(8)), evidencia_urls: [foto], notas: NOTAS_DRON[i % NOTAS_DRON.length], creado_en: dia(7).toISOString(), completado_por: admin.id, completado_en: dia(9).toISOString() })
  }
  if (nivel >= 3) {
    const foto = `${carpeta}/${randomUUID()}.jpg`
    await subir('evidencia-tests', foto, await imagen('Test de residuos', `${l.cultivo} · pasa`), 'image/jpeg')
    await api('POST', '/rest/v1/tests_residuos', { lote_id: l.id, tipo_kit: KITS[i % KITS.length], fecha_prueba: fecha(dia(10)), resultado: 'pasa', foto_evidencia_url: foto, realizado_por: admin.id, creado_en: dia(10).toISOString() })
  }
  hechos++
  console.log(`Nivel ${nivel}: ${l.cultivo}`)
}
console.log('Lotes verificados:', hechos)
