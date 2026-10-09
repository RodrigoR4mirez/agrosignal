// Origen público del sitio para canonical, sitemap y robots. Sale de NEXT_PUBLIC_SITE_URL
// (en producción, https://agrosignal.vercel.app) y cae al dominio de Vercel si falta o es inválida.
export const SITE_URL = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '').origin
  } catch {
    return 'https://agrosignal.vercel.app'
  }
})()

/** Recorta un texto para meta description sin cortar palabras. */
export function resumen(texto: string, maximo = 160) {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  if (limpio.length <= maximo) return limpio
  return `${limpio.slice(0, maximo - 1).replace(/\s+\S*$/, '')}…`
}
