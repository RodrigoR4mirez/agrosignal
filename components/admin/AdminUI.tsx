import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export const adminLink = 'inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline underline-offset-4'
export function AdminHeading({ title, description }: { title: string; description: string }) {
  return <div className="mb-7 space-y-3"><h1 className="text-3xl font-normal sm:text-4xl text-petroleo">{title}</h1><p className="text-sm leading-relaxed text-gray-600">{description}</p></div>
}
export function QueueEmpty({ error, children }: { error: boolean; children: React.ReactNode }) {
  return <Card><p role={error ? 'alert' : undefined} className={`text-sm ${error ? 'text-red-800' : 'text-gray-600'}`}>{error ? 'No pudimos cargar esta sección. Actualiza la página para intentarlo nuevamente.' : children}</p></Card>
}
export function AdminPagination({ page, count, base, filters = {} }: { page: number; count: number; base: string; filters?: Record<string, string> }) {
  const href = (target: number) => `${base}?${new URLSearchParams({ ...filters, pagina: String(target) })}`
  if (page <= 1 && count <= 12) return null
  return <nav aria-label="Páginas de resultados" className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">{page > 1 && <Link href={href(page - 1)} className="rounded-xl border border-gray-300 px-4 py-3">Anteriores</Link>}<span>Página {page}</span>{page * 12 < count && <Link href={href(page + 1)} className="rounded-xl border border-gray-300 px-4 py-3">Siguientes</Link>}</nav>
}
export function adminDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
}
