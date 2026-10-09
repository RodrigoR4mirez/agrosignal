import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { esEjemplo, type LotePublico } from '@/lib/marketplace/types'
import { SITE_URL } from '@/lib/seo'

// Se regenera cada hora para incluir lotes nuevos sin redesplegar.
export const revalidate = 3600

type Fila = Pick<LotePublico, 'id' | 'productor_id' | 'creado_en' | 'descripcion'>

/** Lotes reales del catálogo público. Los de ejemplo quedan fuera (llevan noindex). */
async function lotesPublicos(): Promise<Fila[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !clave) return []
  // Cliente anónimo sin cookies: ve exactamente lo que ve un visitante sin cuenta.
  const db = createClient(url, clave, { auth: { persistSession: false } })
  const { data, error } = await db.from('catalogo_lotes').select('id,productor_id,creado_en,descripcion').order('creado_en', { ascending: false }).limit(5000)
  if (error) return []
  return (data as Fila[]).filter(lote => !esEjemplo(lote))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lotes = await lotesPublicos()
  const productores = new Map<string, string>()
  for (const lote of lotes) if (!productores.has(lote.productor_id)) productores.set(lote.productor_id, lote.creado_en)

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/marketplace`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/marketplace/precios`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/ayuda`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: 'yearly', priority: 0.4 },
    ...lotes.map(lote => ({ url: `${SITE_URL}/marketplace/${lote.id}`, lastModified: new Date(lote.creado_en), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...[...productores].map(([id, fecha]) => ({ url: `${SITE_URL}/marketplace/productor/${id}`, lastModified: new Date(fecha), changeFrequency: 'weekly' as const, priority: 0.6 })),
  ]
}
