import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
import { LotCard } from '@/components/marketplace/LotCard'
import { getProfile } from '@/lib/supabase/auth'
import { getCatalog, PAGE_SIZE, type Filters } from '@/lib/marketplace/data'
import { REGIONES, SELLOS } from '@/lib/marketplace/types'

export const metadata: Metadata = { title: 'Marketplace de cosechas | AgroSignal', description: 'Explora lotes agrícolas de productores peruanos. Busca por cultivo, región, precio, destino y verificación.' }
const input = 'w-full min-h-11 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#1a5c2a] focus:outline-2 focus:outline-[#1a5c2a]/20'
export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const filters = Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) as Filters
  const [profile, catalog] = await Promise.all([getProfile(), getCatalog(filters)])
  const pageLink = (page: number) => { const query = new URLSearchParams(filters as Record<string, string>); query.set('pagina', String(page)); return `/marketplace?${query}` }
  return <AppShell profile={profile}>
    <section className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-linear-to-br from-[#1a5c2a] to-[#0f2e17] px-6 py-8 text-white sm:p-10">
      <div><p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0c14b]">Del campo peruano a tu negocio</p><h1 className="mb-3 text-3xl font-extrabold sm:text-4xl">Encuentra tu próxima cosecha</h1><p className="max-w-2xl text-sm leading-relaxed text-green-50 sm:text-base">Lotes publicados por productores. Compara ofertas, conoce su origen y consulta sus verificaciones.</p></div>
      {(!profile || profile.rol === 'productor') && <Link href={profile?.rol === 'productor' ? '/panel-productor/publicar' : '/registro?rol=productor'} className="inline-flex min-h-11 items-center rounded-xl bg-[#d4a017] px-5 py-3 text-sm font-bold text-[#0f2e17]">Publicar mi cosecha</Link>}
    </section>
    <Card className="mb-8">
      <form key={JSON.stringify(filters)} action="/marketplace" className="space-y-5">
        <div className="flex flex-wrap items-end gap-4"><div className="min-w-0 flex-1 basis-64 space-y-2"><label htmlFor="q" className="block text-sm font-bold">Busca un cultivo</label><input id="q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Ej. palta, mango, café" className={input} /></div><button className="min-h-11 rounded-xl bg-[#1a5c2a] px-6 py-2 text-sm font-bold text-white">Buscar y filtrar</button><Link href="/marketplace" className="py-3 text-sm font-semibold text-[#1a5c2a] underline">Limpiar filtros</Link></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-2"><label htmlFor="region" className="block text-sm font-semibold">Región</label><select id="region" name="region" defaultValue={filters.region ?? ''} className={input}><option value="">Todas las regiones</option>{REGIONES.map(region => <option key={region}>{region}</option>)}</select></div>
          <div className="space-y-2"><label htmlFor="cultivo" className="block text-sm font-semibold">Cultivo</label><select id="cultivo" name="cultivo" defaultValue={filters.cultivo ?? ''} className={input}><option value="">Todos los cultivos</option>{catalog.crops.map(crop => <option key={crop}>{crop}</option>)}</select></div>
          <div className="space-y-2"><label htmlFor="minimo" className="block text-sm font-semibold">Precio mín. (S/)</label><input id="minimo" name="minimo" type="number" min="0" step="0.01" defaultValue={filters.minimo} className={input} placeholder="0.00" /></div>
          <div className="space-y-2"><label htmlFor="maximo" className="block text-sm font-semibold">Precio máx. (S/)</label><input id="maximo" name="maximo" type="number" min="0" step="0.01" defaultValue={filters.maximo} className={input} placeholder="Sin límite" /></div>
          <div className="space-y-2"><label htmlFor="destino" className="block text-sm font-semibold">Destino</label><select id="destino" name="destino" defaultValue={filters.destino ?? ''} className={input}><option value="">Todos</option><option value="local">Mercado local</option><option value="exportacion">Exportación</option></select></div>
          <div className="space-y-2"><label htmlFor="sello" className="block text-sm font-semibold">Verificación</label><select id="sello" name="sello" defaultValue={filters.sello ?? ''} className={input}><option value="">Todos los niveles</option>{SELLOS.map((label, i) => <option key={i} value={i}>{label}</option>)}</select></div>
        </div>
        <p className="text-xs text-gray-500">El precio se muestra por la unidad de cada lote (kg o tonelada). Revisa la unidad al comparar ofertas.</p>
      </form>
    </Card>
    {catalog.error ? <Card><p role="alert" className="text-sm text-red-800">No pudimos cargar las cosechas. Intenta nuevamente en unos momentos.</p><Link href="/marketplace" className="mt-4 inline-block font-semibold text-[#1a5c2a] underline">Volver a intentar</Link></Card> : <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#1a5c2a]">Cosechas disponibles</h2><p className="text-sm text-gray-500">{catalog.count} {catalog.count === 1 ? 'lote encontrado' : 'lotes encontrados'}</p></div>
      {catalog.lots.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{catalog.lots.map((lot, index) => <LotCard key={lot.id} lot={lot} eager={index < 4} />)}</div> : <Card className="py-12 text-center"><h3 className="mb-3 text-xl font-bold">No encontramos lotes con estos filtros</h3><p className="mb-5 text-sm text-gray-600">Prueba otro cultivo o región, o consulta todas las cosechas disponibles.</p><Link href="/marketplace" className="font-semibold text-[#1a5c2a] underline">Ver todas las cosechas</Link></Card>}
      {(catalog.page > 1 || catalog.count > PAGE_SIZE) && <nav aria-label="Paginación de lotes" className="mt-8 flex items-center justify-center gap-5 text-sm font-semibold">{catalog.page > 1 && <Link href={pageLink(catalog.page - 1)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">Anterior</Link>}<p>Página {catalog.page}</p>{catalog.page * PAGE_SIZE < catalog.count && <Link href={pageLink(catalog.page + 1)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">Siguiente</Link>}</nav>}
    </>}
  </AppShell>
}
