import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Avatar } from '@/components/perfil/Avatar'
import { LotCard } from '@/components/marketplace/LotCard'
import { CurvasNivel } from '@/components/landing/Iconos'
import { Estrellas, ResumenReputacion, TarjetaResena } from '@/components/calificaciones/Reputacion'
import { getPerfilProductor, listResenas } from '@/lib/calificaciones/data'
import { promedioTexto } from '@/lib/calificaciones/types'
import { getProducerLots } from '@/lib/marketplace/data'
import { esEjemplo, uuidPattern } from '@/lib/marketplace/types'
import { ENTREGAS, MESES, PRACTICAS, numero } from '@/lib/perfil/types'
import { getProfile } from '@/lib/supabase/auth'

const tarjeta = 'rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8'
const NIVELES = ['Sin verificar', 'Nivel 1 · Documental', 'Nivel 2 · Dron', 'Nivel 3 · Residuos']

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const productor = uuidPattern.test(id) ? await getPerfilProductor(id).catch(() => null) : null
  return { title: productor ? `${productor.nombre} | Productores de AgroSignal` : 'Productor | AgroSignal' }
}

export default async function ProductorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const [profile, productor, resenas, lotes] = await Promise.all([getProfile(), getPerfilProductor(id), listResenas(id), getProducerLots(id)])
  if (!productor) notFound()
  const ejemplo = lotes.lots.some(esEjemplo)
  const desde = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' }).format(new Date(productor.creado_en))
  const { reputacion } = productor
  const conUbicacion = productor.latitud !== null && productor.longitud !== null
  const lat = Number(productor.latitud), lon = Number(productor.longitud)
  const datos: [string, string][] = [
    ...(productor.hectareas ? [['Superficie', `${numero(Number(productor.hectareas), 2)} ha`] as [string, string]] : []),
    ...(productor.altitud_msnm ? [['Altitud', `${numero(productor.altitud_msnm)} m s. n. m.`] as [string, string]] : []),
    ...(productor.capacidad_mensual_kg ? [['Capacidad', `${numero(Number(productor.capacidad_mensual_kg))} kg al mes`] as [string, string]] : []),
    ...(productor.cultivo_principal ? [['Cultivo principal', productor.cultivo_principal] as [string, string]] : []),
    ...(productor.asociacion ? [['Asociación', productor.asociacion] as [string, string]] : []),
    ['Región', productor.region ?? '—'],
  ]
  const insignias = [
    productor.anios_experiencia ? `${productor.anios_experiencia} años de experiencia` : null,
    productor.hectareas ? `${numero(Number(productor.hectareas), 2)} ha` : null,
    productor.altitud_msnm ? `${numero(productor.altitud_msnm)} m s. n. m.` : null,
    productor.region,
  ].filter(Boolean) as string[]

  return <AppShell profile={profile}>
    <nav aria-label="Ruta" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600"><Link href="/marketplace" className="font-semibold text-petroleo underline-offset-4 hover:underline">Productos</Link><span aria-hidden="true">/</span><span className="wrap-anywhere">{productor.nombre}</span></nav>

    {/* Cabecera: quién es, dónde produce y cómo le va */}
    <header className="relative isolate overflow-hidden rounded-[28px] bg-petroleo p-6 text-white sm:p-10">
      <CurvasNivel className="absolute -right-24 -top-28 -z-10 w-[34rem] opacity-40" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar nombre={productor.nombre} foto={productor.foto} className="size-28 text-3xl ring-4 ring-white/25 sm:size-32" />
          <div className="min-w-0">
            {productor.finca && <p className="text-sm font-semibold text-trigo">{productor.finca}</p>}
            <h1 className="mt-1 wrap-anywhere text-4xl font-normal leading-tight text-white sm:text-5xl">{productor.nombre}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
              {reputacion.promedio !== null && reputacion.total >= 3
                ? <><Estrellas valor={reputacion.promedio} tamano={16} /><span className="font-semibold text-white">{promedioTexto(reputacion.promedio)}</span><span>· {reputacion.total} calificaciones</span></>
                : <span>Nuevo en la plataforma</span>}
              <span>· En AgroSignal desde {desde}</span>
            </p>
            {insignias.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{insignias.map(texto => <li key={texto} className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/25 backdrop-blur-md">{texto}</li>)}</ul>}
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center sm:gap-3">
          {[[numero(productor.ventas_completadas), productor.ventas_completadas === 1 ? 'venta completada' : 'ventas completadas'], [numero(productor.lotes_activos), productor.lotes_activos === 1 ? 'lote activo' : 'lotes activos'], [NIVELES[productor.nivel_maximo] ?? NIVELES[0], 'mejor verificación']].map(([valor, etiqueta]) =>
            <div key={etiqueta} className="flex min-w-24 flex-col-reverse rounded-2xl bg-white/10 px-3 py-4 ring-1 ring-white/20 backdrop-blur-md sm:min-w-32"><dt className="mt-1 text-[11px] text-white/70">{etiqueta}</dt><dd className="text-lg font-semibold leading-tight text-white sm:text-xl">{valor}</dd></div>)}
        </dl>
      </div>
    </header>

    {ejemplo && <p className="mt-6 rounded-2xl bg-arena-claro px-5 py-4 text-sm text-cacao"><strong>Productor de ejemplo.</strong> Su perfil, sus lotes y sus reseñas son de demostración y no corresponden a una persona real; la foto es referencial, de un banco de imágenes libre.</p>}

    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
      <div className="min-w-0 space-y-6">
        <section aria-labelledby="sobre-finca" className={tarjeta}>
          <h2 id="sobre-finca" className="text-2xl font-normal text-petroleo">{productor.finca ? `Sobre ${productor.finca}` : 'Sobre su producción'}</h2>
          {productor.sobre_mi ? <p className="mt-4 max-w-[65ch] whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{productor.sobre_mi}</p>
            : <p className="mt-4 text-sm text-gray-500">Este productor aún no escribió sobre su finca.</p>}
          <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">{datos.map(([etiqueta, valor]) => <div key={etiqueta} className="border-b border-[#f0ebdf] pb-3"><dt className="text-gray-500">{etiqueta}</dt><dd className="mt-0.5 font-semibold text-gray-900 wrap-anywhere">{valor}</dd></div>)}</dl>
          {productor.practicas.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-petroleo">Cómo produce</h3><ul className="mt-3 flex flex-wrap gap-2">{productor.practicas.map(p => <li key={p} className="rounded-full bg-musgo/12 px-3 py-1.5 text-sm text-petroleo">{PRACTICAS[p] ?? p}</li>)}</ul></div>}
        </section>

        {(productor.meses_cosecha.length > 0 || productor.entregas.length > 0) && <section aria-labelledby="calendario" className={tarjeta}>
          <h2 id="calendario" className="text-2xl font-normal text-petroleo">Cosecha y entrega</h2>
          {productor.meses_cosecha.length > 0 && <>
            <p className="mt-2 text-sm text-gray-600">Meses en que suele cosechar.</p>
            <ol aria-label="Calendario de cosecha" className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
              {MESES.map((mes, i) => { const activo = productor.meses_cosecha.includes(i + 1); return <li key={mes} aria-label={`${mes}: ${activo ? 'cosecha' : 'sin cosecha'}`} className={`rounded-xl py-2.5 text-center text-xs font-semibold ${activo ? 'bg-naranja text-petroleo' : 'bg-crema text-gray-400'}`}>{mes}</li> })}
            </ol>
          </>}
          {productor.entregas.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-petroleo">Formas de entrega</h3><ul className="mt-3 flex flex-wrap gap-2">{productor.entregas.map(e => <li key={e} className="rounded-full bg-crema px-3 py-1.5 text-sm text-petroleo ring-1 ring-[#ebe4d4]">{ENTREGAS[e] ?? e}</li>)}</ul></div>}
        </section>}

        <section aria-labelledby="resenas" className={tarjeta}>
          <h2 id="resenas" className="mb-4 text-2xl font-normal text-petroleo">Reseñas de compradores</h2>
          {resenas.error ? <p role="alert" className="text-sm text-red-800">No pudimos cargar las reseñas. Actualiza la página para intentarlo nuevamente.</p>
            : resenas.resenas.length ? <div>{resenas.resenas.map(resena => <TarjetaResena key={resena.id} resena={resena} />)}</div>
            : <p className="max-w-prose text-sm leading-relaxed text-gray-600">Todavía no hay reseñas publicadas. Aparecen cuando un comprador recibe su pedido y comparte cómo le fue.</p>}
        </section>
      </div>

      <div className="min-w-0 space-y-6 lg:sticky lg:top-24">
        <section aria-labelledby="ubicacion" className="overflow-hidden rounded-[22px] border border-[#ebe4d4] bg-white">
          <div className="p-6 pb-4 sm:p-8 sm:pb-4"><h2 id="ubicacion" className="text-2xl font-normal text-petroleo">Ubicación de la finca</h2>
            {conUbicacion ? <p className="mt-1 text-sm tabular-nums text-gray-600">{lat.toFixed(5)}, {lon.toFixed(5)}{productor.region ? ` · ${productor.region}` : ''}</p> : <p className="mt-1 text-sm text-gray-600">{productor.region ?? 'Perú'}</p>}</div>
          {conUbicacion ? <>
            <iframe title={`Mapa de la finca de ${productor.nombre}`} loading="lazy" className="aspect-4/3 w-full border-0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03},${lat - 0.02},${lon + 0.03},${lat + 0.02}&layer=mapnik&marker=${lat},${lon}`} />
            <div className="flex flex-wrap gap-x-5 gap-y-2 p-6 pt-4 text-sm font-semibold sm:px-8">
              <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`} target="_blank" rel="noopener noreferrer" className="text-petroleo underline underline-offset-4">Abrir en Google Maps<span className="sr-only"> (se abre en otra pestaña)</span></a>
              <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`} target="_blank" rel="noopener noreferrer" className="text-gray-600 underline underline-offset-4">OpenStreetMap<span className="sr-only"> (se abre en otra pestaña)</span></a>
            </div>
          </> : <p className="px-6 pb-6 text-sm text-gray-500 sm:px-8">El productor aún no marcó la ubicación exacta de su finca.</p>}
        </section>

        <section aria-labelledby="reputacion" className={tarjeta}>
          <h2 id="reputacion" className="mb-6 text-2xl font-normal text-petroleo">Lo que dicen sus compradores</h2>
          <ResumenReputacion reputacion={reputacion} nombre={productor.nombre} />
          <p className="mt-6 text-xs leading-relaxed text-gray-500">Solo califican compradores con un pedido recibido. Cada calificación se publica cuando ambas partes califican, o 14 días después de la entrega.</p>
        </section>
      </div>
    </div>

    <section className="mt-12" aria-labelledby="lotes-productor">
      <h2 id="lotes-productor" className="mb-5 text-2xl font-normal text-petroleo">Cosechas disponibles</h2>
      {lotes.error ? <p role="alert" className={`${tarjeta} text-sm text-red-800`}>No pudimos cargar sus lotes.</p>
        : lotes.lots.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{lotes.lots.map(lot => <LotCard key={lot.id} lot={lot} />)}</div>
        : <p className={`${tarjeta} text-center text-sm text-cacao`}>{productor.nombre} no tiene lotes disponibles en este momento.</p>}
    </section>
  </AppShell>
}
