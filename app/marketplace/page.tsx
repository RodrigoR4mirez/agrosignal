import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
import { LotCard } from '@/components/marketplace/LotCard'
import { FiltrosPlegables, OrdenSelect } from '@/components/marketplace/FiltrosCatalogo'
import { getProfile } from '@/lib/supabase/auth'
import { getCatalog, PAGE_SIZE, type Filters } from '@/lib/marketplace/data'
import { CALIFICACION_MINIMA, ORDENES, REGIONES, SELLOS } from '@/lib/marketplace/types'

export const metadata: Metadata = { title: 'Productos | AgroSignal', description: 'Todos los lotes agrícolas publicados por productores peruanos. Busca por cultivo y filtra por región, precio, destino, verificación y calificación.' }
const input = 'w-full min-h-11 rounded-xl border border-[#d9dccd] bg-[#fbfaf6] px-3 py-2 text-sm focus:border-bosque focus:outline-2 focus:outline-bosque/20'
const FILTROS: (keyof Filters)[] = ['region', 'cultivo', 'minimo', 'maximo', 'destino', 'sello', 'calificacion']

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const filters = Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) as Filters
  const [profile, catalog] = await Promise.all([getProfile(), getCatalog(filters)])
  const orden = ORDENES.some(([value]) => value === filters.orden) ? filters.orden! : 'recientes'
  const activos = FILTROS.filter(key => filters[key]).length
  const pageLink = (page: number) => { const query = new URLSearchParams(filters as Record<string, string>); query.set('pagina', String(page)); return `/marketplace?${query}` }
  const campo = (id: string, label: string, control: React.ReactNode) => <div className="space-y-2"><label htmlFor={id} className="block text-sm font-semibold text-gray-800">{label}</label>{control}</div>

  return <AppShell profile={profile}>
    <form key={JSON.stringify(filters)} action="/marketplace">
      <header className="mb-8">
        <h1 className="text-4xl font-medium text-bosque sm:text-5xl">Productos</h1>
        <p className="mt-2 text-gray-600">Cosechas de productores de todo el Perú. Las estrellas son la calificación que cada productor recibió de sus compradores.</p>
        <div role="search" className="mt-6 flex max-w-3xl flex-wrap gap-2 sm:flex-nowrap">
          <label htmlFor="q" className="sr-only">Busca un cultivo</label>
          <input id="q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Busca un cultivo: palta, mango, café…" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[#d9dccd] bg-white px-4 text-base shadow-[var(--shadow-card)] focus:border-bosque focus:outline-2 focus:outline-bosque/20" />
          <button className="min-h-12 w-full rounded-2xl bg-bosque px-7 text-sm font-bold text-white hover:bg-bosque-claro sm:w-auto">Buscar</button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <aside aria-label="Filtros" className="lg:sticky lg:top-24">
          <FiltrosPlegables activos={activos}>
            <div className="space-y-5 rounded-[20px] border border-[#e4e0d2] bg-white p-5">
              {campo('calificacion', 'Calificación mínima', <select id="calificacion" name="calificacion" defaultValue={filters.calificacion ?? ''} className={input}><option value="">Cualquiera</option>{CALIFICACION_MINIMA.map(([value, label]) => <option key={value} value={value}>{label} ★</option>)}</select>)}
              {campo('sello', 'Verificación AgroSignal', <select id="sello" name="sello" defaultValue={filters.sello ?? ''} className={input}><option value="">Todos los niveles</option>{SELLOS.map((label, i) => <option key={i} value={i}>{label}</option>)}</select>)}
              {campo('cultivo', 'Cultivo', <select id="cultivo" name="cultivo" defaultValue={filters.cultivo ?? ''} className={input}><option value="">Todos los cultivos</option>{catalog.crops.map(crop => <option key={crop}>{crop}</option>)}</select>)}
              {campo('region', 'Región', <select id="region" name="region" defaultValue={filters.region ?? ''} className={input}><option value="">Todas las regiones</option>{REGIONES.map(region => <option key={region}>{region}</option>)}</select>)}
              <fieldset><legend className="mb-2 text-sm font-semibold text-gray-800">Precio por unidad (S/)</legend><div className="grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="minimo">Precio mínimo</label><input id="minimo" name="minimo" type="number" min="0" step="0.01" defaultValue={filters.minimo} className={input} placeholder="Mín." /><label className="sr-only" htmlFor="maximo">Precio máximo</label><input id="maximo" name="maximo" type="number" min="0" step="0.01" defaultValue={filters.maximo} className={input} placeholder="Máx." /></div></fieldset>
              {campo('destino', 'Destino', <select id="destino" name="destino" defaultValue={filters.destino ?? ''} className={input}><option value="">Todos</option><option value="local">Mercado local</option><option value="exportacion">Exportación</option></select>)}
              <button className="min-h-11 w-full rounded-xl bg-bosque text-sm font-bold text-white hover:bg-bosque-claro">Aplicar filtros</button>
              {activos > 0 && <Link href={filters.q ? `/marketplace?q=${encodeURIComponent(filters.q)}` : '/marketplace'} className="block text-center text-sm font-semibold text-bosque underline underline-offset-4">Quitar filtros</Link>}
              <p className="text-xs leading-relaxed text-gray-500">La calificación mínima deja fuera a productores nuevos, que aún no tienen 3 calificaciones. Los precios son por la unidad de cada lote (kg o tonelada).</p>
            </div>
          </FiltrosPlegables>
        </aside>

        <section aria-labelledby="resultados" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 id="resultados" className="text-base font-semibold text-gray-700">{catalog.error ? 'Productos' : `${catalog.count} ${catalog.count === 1 ? 'producto' : 'productos'}${filters.q ? ` para “${filters.q}”` : ''}`}</h2>
            <div className="flex items-center gap-2"><label htmlFor="orden" className="text-sm text-gray-600">Ordenar por</label><OrdenSelect defaultValue={orden} opciones={ORDENES} /></div>
          </div>
          {catalog.error ? <Card><p role="alert" className="text-sm text-red-800">No pudimos cargar los productos. Intenta nuevamente en unos momentos.</p><Link href="/marketplace" className="mt-4 inline-block font-semibold text-bosque underline">Volver a intentar</Link></Card>
            : catalog.lots.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{catalog.lots.map((lot, index) => <LotCard key={lot.id} lot={lot} eager={index < 3} />)}</div>
            : <Card className="bg-arena-claro py-12 text-center"><h3 className="mb-3 text-xl font-medium text-cacao">No encontramos productos con estos filtros</h3><p className="mb-5 text-sm text-gray-700">Prueba otro cultivo o región, o quita la calificación mínima.</p><Link href="/marketplace" className="font-semibold text-bosque underline">Ver todos los productos</Link></Card>}
          {!catalog.error && (catalog.page > 1 || catalog.count > PAGE_SIZE) && <nav aria-label="Paginación de productos" className="mt-8 flex items-center justify-center gap-5 text-sm font-semibold">{catalog.page > 1 && <Link href={pageLink(catalog.page - 1)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">Anterior</Link>}<p>Página {catalog.page}</p>{catalog.page * PAGE_SIZE < catalog.count && <Link href={pageLink(catalog.page + 1)} className="rounded-xl border border-gray-300 bg-white px-4 py-3">Siguiente</Link>}</nav>}
        </section>
      </div>
    </form>
  </AppShell>
}
