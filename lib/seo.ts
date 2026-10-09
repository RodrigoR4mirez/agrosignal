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

// Política de devoluciones para datos estructurados (schema.org). Debe coincidir con /ayuda#devoluciones
// y con private.cierre_devolucion: 7 días; defecto sin costo, arrepentimiento con flete del comprador.
export const POLITICA_DEVOLUCION = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'PE',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 7,
  returnMethod: 'https://schema.org/ReturnByMail',
  // Por defecto el comprador gestiona y paga el flete de vuelta (no hay tarifa fija de AgroSignal);
  // si la cosecha llegó con defecto, la devolución es gratis para él.
  returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  itemDefectReturnFees: 'https://schema.org/FreeReturn',
  customerRemorseReturnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  merchantReturnLink: `${SITE_URL}/ayuda#devoluciones`,
}
