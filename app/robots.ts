import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

// Áreas con sesión: no aportan a la búsqueda y redirigen al login si no hay cuenta.
const PRIVADAS = ['/admin', '/panel-productor', '/panel-comprador', '/pedidos', '/verificaciones', '/compradores', '/mi-cuenta', '/auth/', '/api/']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVADAS },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
