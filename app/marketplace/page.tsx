import type { Metadata } from 'next'
import Form from 'next/form'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { LotCard } from '@/components/marketplace/LotCard'
import { EnvioAutomatico, FiltrosPlegables } from '@/components/marketplace/FiltrosCatalogo'
import { Estrellas } from '@/components/calificaciones/Reputacion'
import { CurvasNivel } from '@/components/landing/Iconos'
import { getProfile } from '@/lib/supabase/auth'
import { getCatalog, PAGE_SIZE, type Filters } from '@/lib/marketplace/data'
import { CALIFICACION_MINIMA, ORDENES, REGIONES, SELLOS } from '@/lib/marketplace/types'

export const metadata: Metadata = { title: 'Productos | AgroSignal', description: 'Todos los lotes agrícolas publicados por productores peruanos. Busca por cultivo y filtra por región, precio, destino, verificación y calificación.' }
const caja = 'app-container px-4 sm:px-6 lg:px-8'
const campoTexto = 'w-full min-h-11 rounded-xl border border-[#e2dbc9] bg-white px-3 py-2 text-sm text-gray-900 focus:border-petroleo focus:outline-2 focus:outline-petroleo/20'
const FILTROS: (keyof Filters)[] = ['region', 'cultivo', 'minimo', 'maximo', 'destino', 'sello', 'calificacion']
const DESTINOS = [['', 'Todos'], ['local', 'Mercado local'], ['exportacion', 'Exportación']] as const

// Opción de radio con estilo de fila; el estado marcado se ve por color, no solo por el círculo.
function Opcion({ name, value, actual, children }: { name: string; value: string; actual?: string; children: React.ReactNode }) {
  return <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-gray-700 hover:bg-crema has-checked:bg-petroleo/[0.07] has-checked:font-semibold has-checked:text-petroleo">
    <input type="radio" name={name} value={value} defaultChecked={(actual ?? '') === value} className="size-4 shrink-0 accent-[#133535]" />{children}
  </label>
}
function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <div className="border-t border-[#f0ebdf] pt-5 first:border-t-0 first:pt-0"><fieldset><legend className="mb-3 text-[13px] font-bold text-petroleo">{titulo}</legend>{children}</fieldset></div>
}

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const filters = Object.fromEntries(Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) as Filters
  const [profile, catalog] = await Promise.all([getProfile(), getCatalog(filters)])
  const orden = ORDENES.some(([value]) => value === filters.orden) ? filters.orden! : 'recientes'
  const activos = FILTROS.filter(key => filters[key]).length
  const enlace = (cambios: Partial<Record<keyof Filters, string | null>>) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([key, value]) => value && !(key === 'orden' && value === 'recientes')))
    query.delete('pagina')
    for (const [key, value] of Object.entries(cambios)) { if (value) query.set(key, value); else query.delete(key) }
    const texto = query.toString()
    return texto ? `/marketplace?${texto}` : '/marketplace'
  }
  const pageLink = (page: number) => enlace({ pagina: String(page) })
  const chips: [keyof Filters, string][] = [
    ...(filters.q ? [['q', `“${filters.q}”`] as [keyof Filters, string]] : []),
    ...FILTROS.filter(key => filters[key]).map(key => [key, {
      region: filters.region, cultivo: filters.cultivo, minimo: `Desde S/ ${filters.minimo}`, maximo: `Hasta S/ ${filters.maximo}`,
      destino: filters.destino === 'local' ? 'Mercado local' : 'Exportación', sello: SELLOS[Number(filters.sello)] ?? 'Verificación',
      calificacion: `${filters.calificacion?.replace('.', ',')} ★ o más`,
    }[key as string] ?? ''] as [keyof Filters, string]),
  ]

  return <AppShell profile={profile} anchoCompleto>
    <Form key={JSON.stringify(filters)} action="/marketplace" scroll={false} className="tipo-sans">
      <EnvioAutomatico />
      {/* Cabecera: búsqueda protagonista y accesos rápidos a los cultivos más publicados */}
      <section className="relative overflow-hidden bg-petroleo text-white">
        <CurvasNivel className="absolute -right-32 -top-24 w-[38rem] opacity-40" />
        <div className={`${caja} relative py-12 lg:py-16`}>
          <h1 className="text-4xl font-normal leading-tight text-white sm:text-5xl lg:text-[56px]">Cosechas del Perú</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/80">Lotes publicados por quienes los cultivan. Cada uno muestra su verificación y la calificación que el productor recibió de sus compradores.</p>
          <div role="search" className="mt-8 flex max-w-3xl flex-col gap-2 rounded-[28px] bg-white p-2 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5)] sm:flex-row sm:rounded-full">
            <label htmlFor="q" className="sr-only">Busca un cultivo</label>
            <div className="relative flex-1">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-petroleo/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input id="q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Busca un cultivo: palta, mango, café…" className="min-h-12 w-full rounded-full bg-transparent pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-500 focus:outline-2 focus:outline-petroleo/25" />
            </div>
            <button className="min-h-12 rounded-full bg-naranja px-8 text-[15px] font-semibold text-petroleo transition-colors hover:bg-[#f29a5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-petroleo">Buscar</button>
          </div>
          {catalog.popular.length > 0 && <nav aria-label="Cultivos más publicados" className="-mx-4 mt-6 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {catalog.popular.map(([cultivo, total]) => {
              const activo = filters.q?.toLowerCase() === cultivo.toLowerCase()
              return <Link key={cultivo} href={enlace({ q: activo ? null : cultivo })} aria-current={activo ? 'true' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${activo ? 'border-naranja bg-naranja font-semibold text-petroleo' : 'border-white/25 text-white/90 hover:border-white/60 hover:bg-white/10'}`}>{cultivo}<span className={`text-xs tabular-nums ${activo ? 'text-petroleo/70' : 'text-white/55'}`}>{total}</span></Link>
            })}
          </nav>}
        </div>
      </section>

      <div className="bg-crema">
        <div className={`${caja} grid gap-8 py-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:py-12`}>
          <aside aria-label="Filtros" className="lg:sticky lg:top-24">
            <FiltrosPlegables activos={activos}>
              <div className="space-y-5 rounded-[22px] border border-[#ebe4d4] bg-white p-5">
                <Grupo titulo="Destino">
                  <div className="flex flex-wrap gap-2">
                    {DESTINOS.map(([value, label]) => <label key={value} className="relative flex min-h-10 cursor-pointer items-center rounded-full px-4 text-sm text-gray-700 ring-1 ring-[#e2dbc9] hover:ring-petroleo/40 has-checked:bg-petroleo has-checked:font-semibold has-checked:text-white has-checked:ring-petroleo has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-petroleo">
                      <input type="radio" name="destino" value={value} defaultChecked={(filters.destino ?? '') === value} className="sr-only" />{label}
                    </label>)}
                  </div>
                </Grupo>
                <Grupo titulo="Calificación del productor">
                  <Opcion name="calificacion" value="" actual={filters.calificacion}>Cualquiera</Opcion>
                  {CALIFICACION_MINIMA.map(([value, label]) => <Opcion key={value} name="calificacion" value={value} actual={filters.calificacion}><Estrellas valor={Number(value)} tamano={14} /><span>{label}</span></Opcion>)}
                </Grupo>
                <Grupo titulo="Verificación AgroSignal">
                  <Opcion name="sello" value="" actual={filters.sello}>Todos los niveles</Opcion>
                  {SELLOS.map((label, i) => <Opcion key={i} name="sello" value={String(i)} actual={filters.sello}>{label}</Opcion>)}
                </Grupo>
                <Grupo titulo="Cultivo y región">
                  <div className="space-y-2">
                    <label htmlFor="cultivo" className="sr-only">Cultivo</label>
                    <select id="cultivo" name="cultivo" defaultValue={filters.cultivo ?? ''} className={campoTexto}><option value="">Todos los cultivos</option>{catalog.crops.map(crop => <option key={crop}>{crop}</option>)}</select>
                    <label htmlFor="region" className="sr-only">Región</label>
                    <select id="region" name="region" defaultValue={filters.region ?? ''} className={campoTexto}><option value="">Todas las regiones</option>{REGIONES.map(region => <option key={region}>{region}</option>)}</select>
                  </div>
                </Grupo>
                <Grupo titulo="Precio por unidad (S/)">
                  <div className="grid grid-cols-2 gap-2"><label className="sr-only" htmlFor="minimo">Precio mínimo</label><input id="minimo" name="minimo" type="number" min="0" step="0.01" defaultValue={filters.minimo} className={campoTexto} placeholder="Mín." /><label className="sr-only" htmlFor="maximo">Precio máximo</label><input id="maximo" name="maximo" type="number" min="0" step="0.01" defaultValue={filters.maximo} className={campoTexto} placeholder="Máx." /></div>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">Por la unidad de cada lote (kg o tonelada).</p>
                </Grupo>
                <button className="min-h-11 w-full rounded-full bg-petroleo text-sm font-semibold text-white hover:bg-[#1d4a4a]">Aplicar filtros</button>
                {activos > 0 && <Link href={filters.q ? `/marketplace?q=${encodeURIComponent(filters.q)}` : '/marketplace'} className="block text-center text-sm font-semibold text-petroleo underline underline-offset-4">Quitar filtros</Link>}
              </div>
            </FiltrosPlegables>
          </aside>

          <section aria-labelledby="resultados" className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="resultados" className="text-lg font-semibold text-petroleo" aria-live="polite">{catalog.error ? 'Productos' : `${catalog.count} ${catalog.count === 1 ? 'producto' : 'productos'}`}</h2>
              <div className="flex items-center gap-2"><label htmlFor="orden" className="text-sm text-gray-600">Ordenar por</label>
                <select id="orden" name="orden" defaultValue={orden} className="min-h-11 rounded-full border border-[#e2dbc9] bg-white px-4 text-sm font-semibold text-petroleo focus:outline-2 focus:outline-petroleo/25">{ORDENES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <noscript><button className="min-h-11 rounded-full border border-petroleo/30 px-4 text-sm font-semibold text-petroleo">Ordenar</button></noscript>
              </div>
            </div>
            {chips.length > 0 && <ul aria-label="Filtros aplicados" className="mt-4 flex flex-wrap gap-2">
              {chips.map(([key, label]) => <li key={key}><Link href={enlace({ [key]: null })} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-3 text-sm text-petroleo ring-1 ring-[#e2dbc9] hover:ring-petroleo/40">
                {label}<span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-crema text-xs">✕</span><span className="sr-only">(quitar filtro)</span></Link></li>)}
            </ul>}

            <div className="mt-6">
              {catalog.error ? <div role="alert" className="rounded-[22px] bg-white p-8 text-sm text-red-800">No pudimos cargar los productos. Intenta nuevamente en unos momentos. <Link href="/marketplace" className="ml-2 font-semibold text-petroleo underline">Volver a intentar</Link></div>
                : catalog.lots.length ? <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{catalog.lots.map((lot, index) => <LotCard key={lot.id} lot={lot} eager={index < 3} />)}</div>
                : <div className="rounded-[22px] border border-dashed border-[#d9cfb8] bg-white px-6 py-14 text-center">
                  <h3 className="text-2xl font-normal text-petroleo">No hay productos con estos filtros</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">Prueba con otro cultivo o región, o quita la calificación mínima: los productores nuevos aún no tienen 3 calificaciones.</p>
                  <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-naranja px-6 text-sm font-semibold text-petroleo hover:bg-[#f29a5e]">Ver todos los productos</Link>
                </div>}
            </div>
            {!catalog.error && (catalog.page > 1 || catalog.count > PAGE_SIZE) && <nav aria-label="Paginación de productos" className="mt-10 flex items-center justify-center gap-4 text-sm font-semibold text-petroleo">
              {catalog.page > 1 && <Link href={pageLink(catalog.page - 1)} className="min-h-11 rounded-full bg-white px-5 py-3 ring-1 ring-[#e2dbc9] hover:ring-petroleo/40">Anterior</Link>}
              <p>Página {catalog.page} de {Math.max(1, Math.ceil(catalog.count / PAGE_SIZE))}</p>
              {catalog.page * PAGE_SIZE < catalog.count && <Link href={pageLink(catalog.page + 1)} className="min-h-11 rounded-full bg-white px-5 py-3 ring-1 ring-[#e2dbc9] hover:ring-petroleo/40">Siguiente</Link>}
            </nav>}
          </section>
        </div>
      </div>
    </Form>
  </AppShell>
}
