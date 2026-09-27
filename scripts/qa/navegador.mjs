// Chrome sin interfaz controlado por el protocolo de depuración (sin dependencias).
// Requiere Google Chrome instalado; la ruta se puede cambiar con CHROME_PATH.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export const esperar = ms => new Promise(r => setTimeout(r, ms))

export async function abrirNavegador({ ancho = 1440, alto = 900 } = {}) {
  const puerto = 9300 + Math.floor(Math.random() * 600)
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'agrosignal-qa-'))
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${puerto}`, `--window-size=${ancho},${alto}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' })
  let tabs
  for (let i = 0; i < 60 && !tabs; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${puerto}/json`)).json() } catch { await esperar(250) } }
  if (!tabs) throw new Error(`No se pudo abrir Chrome en ${CHROME}`)
  const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal })
  let n = 0; const pendientes = new Map()
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pendientes.has(d.id)) { pendientes.get(d.id)(d); pendientes.delete(d.id) } }
  const cmd = (method, params = {}) => new Promise(r => { const id = ++n; pendientes.set(id, r); ws.send(JSON.stringify({ id, method, params })) })
  await cmd('Page.enable')
  await cmd('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: ancho < 600 })
  return {
    ir: async (url, ms = 5000) => { await cmd('Page.navigate', { url }); await esperar(ms) },
    js: async expr => (await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value,
    // Elige un archivo local en un <input type="file"> (dispara los eventos como una persona).
    subirArchivo: async (selector, ruta) => {
      const r = await cmd('Runtime.evaluate', { expression: `document.querySelector(${JSON.stringify(selector)})` })
      const objectId = r.result?.result?.objectId
      if (!objectId) throw new Error(`No existe ${selector}`)
      await cmd('DOM.setFileInputFiles', { files: [ruta], objectId })
    },
    captura: async archivo => { const r = await cmd('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(archivo, Buffer.from(r.result.data, 'base64')) },
    cerrar: async () => {
      ws.close()
      const salio = new Promise(r => chrome.once('exit', r))
      chrome.kill(); await Promise.race([salio, esperar(3000)])
      try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }) } catch { /* carpeta temporal: el sistema la limpia */ }
    },
  }
}
