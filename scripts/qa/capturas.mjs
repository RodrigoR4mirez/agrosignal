// Capturas de pantalla para revisión visual en escritorio (1440) y celular (390).
// Uso: node scripts/qa/capturas.mjs <url-base> <carpeta-salida> [ruta ...]
// Ej.: node scripts/qa/capturas.mjs http://localhost:3100 /tmp/capturas / /marketplace /contacto
import fs from 'node:fs'
import path from 'node:path'
import { abrirNavegador } from './navegador.mjs'

const [base, salida, ...rutas] = process.argv.slice(2)
if (!base || !salida) { console.error('Uso: node scripts/qa/capturas.mjs <url-base> <carpeta-salida> [ruta ...]'); process.exit(2) }
fs.mkdirSync(salida, { recursive: true })
for (const [ancho, alto] of [[1440, 1000], [390, 844]]) {
  const nav = await abrirNavegador({ ancho, alto })
  try {
    for (const ruta of rutas.length ? rutas : ['/', '/marketplace']) {
      await nav.ir(base.replace(/\/$/, '') + ruta)
      const archivo = path.join(salida, `${ruta.replace(/[^a-z0-9]+/gi, '_') || 'inicio'}-${ancho}.png`)
      await nav.captura(archivo)
      console.log(archivo)
    }
  } finally { await nav.cerrar() }
}
