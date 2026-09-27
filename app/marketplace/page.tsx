import type { Metadata } from 'next'
import Form from 'next/form'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { InfiniteCatalog } from '@/components/marketplace/InfiniteCatalog'
import { EnvioAutomatico, FiltrosPlegables } from '@/components/marketplace/FiltrosCatalogo'
import { Estrellas } from '@/components/calificaciones/Reputacion'
import { IconoCertificado, IconoEstrellas, IconoGarantia, IconoMercado } from '@/components/landing/Iconos'
import { getProfile } from '@/lib/supabase/auth'
import { filtrosEfectivos, getCatalog, type Filters } from '@/lib/marketplace/data'
import { CALIFICACION_MINIMA, ORDENES, REGIONES, SELLOS, photoUrl } from '@/lib/marketplace/types'

export const metadata: Metadata = { title: 'Productos | AgroSignal', description: 'Todos los lotes agrícolas publicados por productores peruanos. Busca por cultivo, encuentra ofertas y filtra por región, precio, destino, verificación y calificación.' }
const caja = 'app-container px-4 sm:px-6 lg:px-8'
const campoTexto = 'w-full min-h-11 rounded-xl border border-[#e2dbc9] bg-white px-3 py-2 text-sm text-gray-900 focus:border-petroleo focus:outline-2 focus:outline-petroleo/20'
const vidrio = 'bg-white/15 ring-1 ring-white/30 backdrop-blur-xl'
const FILTROS: (keyof Filters)[] = ['region', 'cultivo', 'minimo', 'maximo', 'destino', 'sello', 'calificacion', 'ofertas']
const PARAMETROS = new Set<keyof Filters>(['q', ...FILTROS, 'orden'])
const DESTINOS = [['', 'Todos'], ['local', 'Mercado local'], ['exportacion', 'Exportación']] as const
const VENTAJAS = [
  [IconoMercado, 'Directo del productor', 'Sin intermediarios'],
  [IconoCertificado, 'Verificación en 3 niveles', 'Certificado, dron y test'],
  [IconoEstrellas, 'Calificaciones reales', 'Solo de pedidos recibidos'],
  [IconoGarantia, 'Pago en garantía', 'Próximamente'],
] as const

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
  const filters = Object.fromEntries(Object.entries(params).filter((entry): entry is [keyof Filters, string] => PARAMETROS.has(entry[0] as keyof Filters) && typeof entry[1] === 'string')) as Filters
  const [profile, catalog] = await Promise.all([getProfile(), getCatalog(filters)])
  const orden = ORDENES.some(([value]) => value === filters.orden) ? filters.orden! : 'recientes'
  const activos = FILTROS.filter(key => filters[key]).length
  const vender = !profile ? '/registro?rol=productor' : profile.rol === 'productor' ? '/panel-productor/publicar' : '/ayuda#publicar'
  const enlace = (cambios: Partial<Record<keyof Filters, string | null>>) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([key, value]) => value && !(key === 'orden' && value === 'recientes')))
    query.delete('pagina')
    for (const [key, value] of Object.entries(cambios)) { if (value && !(key === 'orden' && value === 'recientes')) query.set(key, value); else query.delete(key) }
    const texto = query.toString()
    return texto ? `/marketplace?${texto}` : '/marketplace'
  }
  const chips: [keyof Filters, string][] = [
    ...(filters.q ? [['q', `“${filters.q}”`] as [keyof Filters, string]] : []),
    ...FILTROS.filter(key => filters[key]).map(key => [key, {
      region: filters.region, cultivo: filters.cultivo, minimo: `Desde S/ ${filters.minimo}`, maximo: `Hasta S/ ${filters.maximo}`,
      destino: filters.destino === 'local' ? 'Mercado local' : 'Exportación', sello: SELLOS[Number(filters.sello)] ?? 'Verificación',
      calificacion: `${filters.calificacion?.replace('.', ',')} ★ o más`, ofertas: 'Con descuento',
    }[key as string] ?? ''] as [keyof Filters, string]),
  ]
  const fotoOferta = photoUrl(catalog.ofertas.foto)

  return <AppShell profile={profile} anchoCompleto>
    <Form key={JSON.stringify(filters)} action="/marketplace" scroll={false} className="bg-crema">
      <EnvioAutomatico />

      {/* Banners: principal con el buscador en vidrio y, al lado, ofertas (o invitación a publicar) */}
      <div className={`${caja} pt-6 lg:pt-8`}>
        <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <section className="relative isolate overflow-hidden rounded-[28px] text-white">
            <Image src="/catalogo/banner-mercado-lima.jpg" alt="" fill priority sizes="(max-width: 1024px) 100vw, 64vw" className="-z-10 object-cover object-[50%_28%]" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-petroleo/95 via-petroleo/70 to-petroleo/20" />
            <div className="flex min-h-[22rem] max-w-2xl flex-col justify-center p-6 sm:p-10 lg:min-h-[26rem] lg:p-12">
              <h1 className="text-4xl font-normal leading-[1.1] text-white sm:text-5xl">Cosechas del Perú, directo de quien las cultiva</h1>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/80">Compara precios, revisa la verificación de cada lote y la calificación de su productor.</p>
              <div role="search" className={`mt-7 flex flex-col gap-1.5 rounded-[26px] p-1.5 sm:flex-row sm:rounded-full ${vidrio}`}>
                <label htmlFor="q" className="sr-only">Busca un cultivo</label>
                <div className="relative flex-1">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-petroleo/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  <input id="q" name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Palta, mango, café…" className="min-h-12 w-full rounded-full bg-white pl-12 pr-4 text-base text-gray-900 placeholder:text-gray-500 focus:outline-2 focus:outline-naranja" />
                </div>
                <button className="min-h-12 rounded-full bg-naranja px-8 text-[15px] font-semibold text-petroleo transition-colors hover:bg-[#f29a5e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Buscar</button>
              </div>
              {catalog.popular.length > 0 && <nav aria-label="Cultivos más publicados" className="-mx-6 mt-5 flex items-center gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                {catalog.popular.map(([cultivo, total]) => {
                  const activo = filters.q?.toLowerCase() === cultivo.toLowerCase()
                  return <Link key={cultivo} href={enlace({ q: activo ? null : cultivo })} aria-current={activo ? 'true' : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${activo ? 'bg-naranja font-semibold text-petroleo' : `${vidrio} text-white hover:bg-white/25`}`}>{cultivo}<span className={`text-xs tabular-nums ${activo ? 'text-petroleo/70' : 'text-white/60'}`}>{total}</span></Link>
                })}
              </nav>}
            </div>
          </section>

          {catalog.ofertas.total > 0
            ? <Link href={enlace({ ofertas: '1' })} className="group relative flex min-h-64 flex-col overflow-hidden rounded-[28px] bg-trigo p-7 text-petroleo sm:p-9">
              <p className="text-sm font-semibold">Ofertas de temporada</p>
              <p className="relative z-10 mt-2 text-5xl font-normal leading-none sm:text-6xl lg:text-7xl"><span className="align-top text-2xl">hasta </span>{catalog.ofertas.maxima}%</p>
              <p className="relative z-10 mt-2 max-w-[11rem] text-[15px] leading-snug sm:max-w-[13rem]">{catalog.ofertas.total} {catalog.ofertas.total === 1 ? 'lote con precio rebajado' : 'lotes con precio rebajado'} por sus productores.</p>
              <span className="relative z-10 mt-7 inline-flex min-h-11 w-fit items-center rounded-full bg-petroleo px-6 text-sm font-semibold text-white transition-colors group-hover:bg-bosque-claro">Ver ofertas</span>
              {fotoOferta && <span aria-hidden="true" className="absolute -bottom-8 -right-8 size-40 overflow-hidden rounded-full ring-[10px] ring-white/35 sm:size-56 lg:-bottom-6 lg:-right-6 lg:size-60 xl:size-72"><Image src={fotoOferta} alt="" fill unoptimized sizes="16rem" className="object-cover transition-transform duration-700 group-hover:scale-105" /></span>}
            </Link>
            : <Link href={vender} className="group relative flex min-h-64 flex-col overflow-hidden rounded-[28px] bg-trigo p-7 text-petroleo sm:p-9">
              <p className="text-sm font-semibold">Para productores</p>
              <p className="mt-2 max-w-[14rem] text-3xl font-normal leading-tight">Publica tu cosecha gratis</p>
              <span className="relative z-10 mt-auto inline-flex min-h-11 w-fit items-center rounded-full bg-petroleo px-6 text-sm font-semibold text-white">Empezar</span>
              <span aria-hidden="true" className="absolute -bottom-10 -right-10 size-56 overflow-hidden rounded-full ring-[10px] ring-white/35"><Image src="/catalogo/agricultor-canasta.jpg" alt="" fill sizes="16rem" className="object-cover object-[40%_50%]" /></span>
            </Link>}
        </div>

        {/* Ventajas: por qué comprar aquí */}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VENTAJAS.map(([Icono, titulo, texto]) => <li key={titulo} className="flex items-center gap-4 rounded-[20px] bg-white p-4 ring-1 ring-[#ebe4d4]">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-crema"><Icono className="size-7 text-musgo" /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold text-petroleo">{titulo}</span><span className="block text-xs text-gray-500">{texto}</span></span>
          </li>)}
        </ul>
      </div>

      {/* Productos */}
      <div className={`${caja} grid gap-8 py-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:py-12`}>
        <aside aria-label="Filtros" className="space-y-4 lg:sticky lg:top-24">
          <FiltrosPlegables activos={activos}>
            <div className="space-y-5 rounded-[22px] border border-[#ebe4d4] bg-white p-5">
              <Grupo titulo="Ofertas">
                <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-gray-700 hover:bg-crema has-checked:bg-naranja/15 has-checked:font-semibold has-checked:text-petroleo">
                  <input type="checkbox" name="ofertas" value="1" defaultChecked={filters.ofertas === '1'} className="size-4 shrink-0 accent-[#133535]" />Solo lotes con descuento
                </label>
              </Grupo>
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
              {orden !== 'recientes' && <input type="hidden" name="orden" value={orden} />}
              <button className="min-h-11 w-full rounded-full bg-petroleo text-sm font-semibold text-white hover:bg-bosque-claro">Aplicar filtros</button>
              {activos > 0 && <Link href={filters.q ? `/marketplace?q=${encodeURIComponent(filters.q)}` : '/marketplace'} className="block text-center text-sm font-semibold text-petroleo underline underline-offset-4">Quitar filtros</Link>}
            </div>
          </FiltrosPlegables>

          {/* Banner lateral para productores (solo escritorio) */}
          <Link href={vender} className="group relative isolate hidden min-h-[24rem] flex-col justify-end overflow-hidden rounded-[22px] p-6 text-white lg:flex">
            <Image src="/catalogo/productora-arvejas-cusco.jpg" alt="" fill sizes="17rem" className="-z-10 object-cover object-[60%_30%] transition-transform duration-700 group-hover:scale-105" />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-petroleo/90 via-petroleo/35 to-transparent" />
            <span className="text-2xl font-normal leading-tight">¿Tienes una cosecha?</span>
            <span className="mt-2 text-sm text-white/85">Publícala gratis y recibe pedidos de todo el país.</span>
            <span className="mt-5 inline-flex min-h-10 w-fit items-center rounded-full bg-white px-5 text-sm font-semibold text-petroleo">Publicar mi cosecha</span>
          </Link>
        </aside>

        <section aria-labelledby="resultados" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[#e2dbc9]">
            <div className="flex flex-wrap items-baseline gap-x-4 pb-3"><h2 id="resultados" className="text-2xl font-normal text-petroleo" aria-live="polite">{catalog.error ? 'Productos' : <>Productos <span className="text-base text-gray-500">· {catalog.count}</span></>}</h2><Link href="/marketplace/precios" className="text-sm font-semibold text-petroleo underline underline-offset-4">Ver precios por cultivo</Link></div>
            <nav aria-label="Ordenar productos" className="-mb-px flex gap-5 overflow-x-auto text-sm">
              {ORDENES.map(([value, label]) => <Link key={value} href={enlace({ orden: value })} aria-current={orden === value ? 'true' : undefined} className={`shrink-0 border-b-2 pb-3 transition-colors ${orden === value ? 'border-naranja font-semibold text-petroleo' : 'border-transparent text-gray-500 hover:text-petroleo'}`}>{label}</Link>)}
            </nav>
          </div>
          {chips.length > 0 && <ul aria-label="Filtros aplicados" className="mt-4 flex flex-wrap gap-2">
            {chips.map(([key, label]) => <li key={key}><Link href={enlace({ [key]: null })} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-3 text-sm text-petroleo ring-1 ring-[#e2dbc9] hover:ring-petroleo/40">
              {label}<span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-crema text-xs">✕</span><span className="sr-only">(quitar filtro)</span></Link></li>)}
          </ul>}

          <div className="mt-6">
            {catalog.error ? <div role="alert" className="rounded-[22px] bg-white p-8 text-sm text-red-800">No pudimos cargar los productos. Intenta nuevamente en unos momentos. <Link href="/marketplace" className="ml-2 font-semibold text-petroleo underline">Volver a intentar</Link></div>
              : catalog.lots.length ? <InfiniteCatalog key={JSON.stringify(filters)} initialLots={catalog.lots} initialCursor={catalog.nextCursor} filters={filtrosEfectivos(filters)} exportHref={enlace({ destino: 'exportacion' })} />
              : <div className="rounded-[22px] border border-dashed border-[#d9cfb8] bg-white px-6 py-14 text-center">
                <h3 className="text-2xl font-normal text-petroleo">No hay productos con estos filtros</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">Prueba con otro cultivo o región, o quita la calificación mínima: los productores nuevos aún no tienen 3 calificaciones.</p>
                <Link href="/marketplace" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-naranja px-6 text-sm font-semibold text-petroleo hover:bg-[#f29a5e]">Ver todos los productos</Link>
              </div>}
          </div>
        </section>
      </div>

      {/* Categorías: tres entradas rápidas con panel de vidrio */}
      <div className={`${caja} pb-14`}>
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            ['/catalogo/cafe-cerezas.jpg', 'Café y cacao de la selva', 'Cafés especiales y cacao fino', enlace({ q: 'Café' }), 'object-[50%_45%]'],
            ['/catalogo/mercado-local-peru.jpg', 'Frescos para el mercado local', 'Frutas y verduras del día', enlace({ destino: 'local' }), 'object-[45%_60%]'],
            ['/catalogo/papa-cosecha-andes.jpg', 'Papa nativa y cultivos andinos', 'De la sierra a tu mesa', enlace({ q: 'Papa' }), 'object-[50%_45%]'],
          ].map(([foto, titulo, texto, href, encuadre]) => <li key={titulo}>
            <Link href={href} className="group relative isolate flex min-h-60 items-end overflow-hidden rounded-[24px] p-3">
              <Image src={foto} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className={`-z-10 object-cover transition-transform duration-700 group-hover:scale-105 ${encuadre}`} />
              <span className="w-full rounded-[18px] bg-white/20 p-4 text-white ring-1 ring-white/35 backdrop-blur-xl backdrop-saturate-150">
                <span className="block text-lg font-semibold leading-tight [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">{titulo}</span>
                <span className="mt-0.5 flex items-center justify-between gap-3 text-sm text-white/90"><span>{texto}</span><span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-petroleo transition-transform group-hover:translate-x-0.5">›</span></span>
              </span>
            </Link>
          </li>)}
        </ul>
      </div>
    </Form>
  </AppShell>
}
