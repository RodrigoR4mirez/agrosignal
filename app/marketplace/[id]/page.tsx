import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { AppShell } from '@/components/AppShell'
import { SelloInocuidadBadge } from '@/components/SelloInocuidadBadge'
import { GaleriaLote } from '@/components/marketplace/GaleriaLote'
import { getPublicSello } from '@/lib/sello/data'
import { SelloSummary } from '@/components/sello/SelloSummary'
import { getPublicLot } from '@/lib/marketplace/data'
import { getPerfilProductor } from '@/lib/calificaciones/data'
import { ReputacionCompacta, ResumenReputacion } from '@/components/calificaciones/Reputacion'
import { getProfile } from '@/lib/supabase/auth'
import { COSECHA, descripcionVisible, descuento, esEjemplo, money, photoUrl, quantity, uuidPattern } from '@/lib/marketplace/types'
import { Avatar } from '@/components/perfil/Avatar'
import { BotonSeguir } from '@/components/comunidad/BotonSeguir'
import { GraficoPrecios } from '@/components/comunidad/GraficoPrecios'
import { getHistorialPrecios, getSiguiendo } from '@/lib/comunidad/data'
import { resumen } from '@/lib/seo'

// Metadatos y página leen el mismo lote una sola vez por solicitud.
const loteCacheado = cache(getPublicLot)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const lot = uuidPattern.test(id) ? await loteCacheado(id).catch(() => null) : null
  if (!lot) return { title: 'Lote no encontrado | AgroSignal', robots: { index: false } }
  const titulo = `${lot.cultivo} en ${lot.provincia}, ${lot.region} | AgroSignal`
  const descripcion = resumen(`${lot.cultivo} de ${lot.distrito}, ${lot.region}: ${money(lot.precio_unidad)} por ${lot.unidad}, ${quantity(lot.cantidad_disponible)} ${lot.unidad} disponibles. Verificado ${lot.nivel_sello}/3. Publicado por ${lot.productor_nombre}.`)
  const foto = lot.fotos.map(photoUrl).find(Boolean)
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/marketplace/${id}` },
    openGraph: { title: titulo, description: descripcion, url: `/marketplace/${id}`, type: 'website', ...(foto && { images: [{ url: foto, alt: `Lote de ${lot.cultivo} en ${lot.region}` }] }) },
    twitter: { card: foto ? 'summary_large_image' : 'summary', title: titulo, description: descripcion, ...(foto && { images: [foto] }) },
    // Los lotes de ejemplo no son ofertas reales: no deben aparecer en buscadores.
    ...(esEjemplo(lot) && { robots: { index: false, follow: true } }),
  }
}

export default async function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const [lot, profile, sello] = await Promise.all([loteCacheado(id), getProfile(), getPublicSello(id)])
  if (!lot) notFound()
  const productor = await getPerfilProductor(lot.productor_id).catch(() => null)
  const ejemplo = esEjemplo(lot)
  const descripcion = descripcionVisible(lot)
  const photos = lot.fotos.flatMap(path => { const url = photoUrl(path); return url ? [url] : [] })
  const rebaja = descuento(lot)
  const base = lot.cultivo.trim().split(/\s+/)[0]
  const [historial, siguiendo] = await Promise.all([getHistorialPrecios(base, 12), profile?.rol === 'comprador' ? getSiguiendo(lot.productor_id) : Promise.resolve(false)])
  const precioKg = lot.unidad === 'ton' ? Number(lot.precio_unidad) / 1000 : Number(lot.precio_unidad)
  const recientes = historial.serie.slice(-3).filter(p => p.publicado !== null)
  const referencia = recientes.length ? recientes.reduce((s, p) => s + p.publicado!, 0) / recientes.length : null
  const diferencia = referencia ? Math.round(((precioKg - referencia) / referencia) * 100) : null
  const datos: [string, string][] = [
    ['Disponible', `${quantity(lot.cantidad_disponible)} ${lot.unidad}`], ['Estado', COSECHA[lot.estado_cosecha]],
    ['Destino', lot.destino === 'local' ? 'Mercado local' : 'Exportación'], ['Ubicación', `${lot.distrito}, ${lot.provincia}, ${lot.region}`],
    ['Riesgo declarado por el productor', { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }[lot.nivel_riesgo]],
    ['Publicado', new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(lot.creado_en))],
  ]
  const accion = profile?.id === lot.productor_id
    ? <Link href={`/panel-productor/mis-lotes/${id}/editar`} className="flex min-h-12 w-full items-center justify-center rounded-full bg-petroleo px-6 text-[15px] font-semibold text-white hover:bg-bosque-claro">Editar mi lote</Link>
    : ejemplo ? <p className="rounded-2xl bg-arena-claro px-5 py-4 text-sm leading-relaxed text-cacao"><strong>Lote de ejemplo.</strong> Muestra cómo se ve una publicación en AgroSignal; el productor y la oferta no son reales y no se puede comprar.</p>
    : profile?.rol === 'comprador' ? <Link href={`/panel-comprador/comprar/${id}`} className="flex min-h-12 w-full items-center justify-center rounded-full bg-naranja px-6 text-[15px] font-semibold text-petroleo hover:bg-[#f29a5e]">Solicitar compra</Link>
    : !profile ? <div className="space-y-2"><Link href={`/login?next=${encodeURIComponent(`/panel-comprador/comprar/${id}`)}`} className="flex min-h-12 w-full items-center justify-center rounded-full bg-naranja px-6 text-[15px] font-semibold text-petroleo hover:bg-[#f29a5e]">Ingresar para comprar</Link><p className="text-center text-xs text-gray-500">Necesitas una cuenta de comprador para enviar tu pedido.</p></div>
    : null

  return <AppShell profile={profile}>
    <nav aria-label="Ruta" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-600"><Link href="/marketplace" className="font-semibold text-petroleo underline-offset-4 hover:underline">Productos</Link><span aria-hidden="true">/</span><span className="wrap-anywhere">{lot.cultivo}</span></nav>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
      <div className="min-w-0">
        <GaleriaLote fotos={photos} alt={`Lote de ${lot.cultivo} en ${lot.region}`} />
      </div>

      <aside aria-label="Resumen del lote" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-tierra"><svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>{lot.provincia}, {lot.region}</p>
          <h1 className="mt-2 wrap-anywhere text-4xl font-normal leading-tight text-petroleo sm:text-5xl">{lot.cultivo}</h1>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1"><p className="wrap-anywhere text-4xl font-bold tabular-nums text-petroleo">{money(lot.precio_unidad)}<span className="ml-2 text-base font-normal text-gray-500">por {lot.unidad}</span></p>{rebaja && <><p className="text-lg tabular-nums text-gray-400 line-through"><span className="sr-only">Antes </span>{money(Number(lot.precio_anterior))}</p><span className="rounded-full bg-naranja px-3 py-1 text-sm font-bold text-petroleo">−{rebaja}%</span></>}</div>
          <ul className="mt-5 flex flex-wrap gap-2 text-sm">
            <li className="rounded-full bg-crema px-3 py-1.5 font-semibold text-petroleo">{quantity(lot.cantidad_disponible)} {lot.unidad} disponibles</li>
            <li className="rounded-full bg-crema px-3 py-1.5 text-petroleo">{COSECHA[lot.estado_cosecha]}</li>
            <li className="rounded-full bg-crema px-3 py-1.5 text-petroleo">{lot.destino === 'local' ? 'Mercado local' : 'Exportación'}</li>
          </ul>
          <div className="mt-5"><SelloInocuidadBadge nivel={lot.nivel_sello} /></div>
          {accion && <div className="mt-7">{accion}</div>}
          <Link href={`/marketplace/productor/${lot.productor_id}`} className="group mt-7 flex items-center gap-3 border-t border-[#f0ebdf] pt-6">
            <Avatar nombre={lot.productor_nombre} foto={lot.productor_foto} className="size-12 text-sm" />
            <span className="min-w-0"><span className="block text-xs text-gray-500">Publicado por</span><span className="block truncate font-semibold text-gray-900 underline-offset-4 group-hover:underline">{lot.productor_nombre}</span><ReputacionCompacta promedio={lot.productor_promedio} total={lot.productor_calificaciones} /></span>
          </Link>
          <div className="mt-3"><BotonSeguir productorId={lot.productor_id} siguiendo={siguiendo} modo={!profile ? 'anonimo' : profile.rol === 'comprador' ? 'comprador' : 'oculto'} /></div>
        </div>
      </aside>
    </div>

    <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
      <div className="min-w-0 space-y-8">
        <section aria-labelledby="info-cosecha" className="rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8">
          <h2 id="info-cosecha" className="text-2xl font-normal text-petroleo">Información de la cosecha</h2>
          <dl className="mt-6 grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">{datos.map(([label, value]) => <div key={label} className="border-b border-[#f0ebdf] pb-4"><dt className="mb-1 text-gray-500">{label}</dt><dd className="wrap-anywhere font-semibold text-gray-900">{value}</dd></div>)}</dl>
          {descripcion && <div className="mt-6"><h3 className="mb-2 text-base font-semibold text-petroleo">Descripción</h3><p className="max-w-[65ch] wrap-anywhere whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">{descripcion}</p></div>}
        </section>
        {historial.serie.length > 0 && <section aria-labelledby="precio-historico" className="rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3"><h2 id="precio-historico" className="text-2xl font-normal text-petroleo">Precio de {base.toLowerCase()} en AgroSignal</h2><Link href={`/marketplace/precios?cultivo=${encodeURIComponent(base.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))}`} className="text-sm font-semibold text-petroleo underline underline-offset-4">Ver historial completo</Link></div>
          {diferencia !== null && <p className="mb-5 text-sm text-gray-700">Este lote está <strong className={`font-semibold ${diferencia <= 0 ? 'text-musgo' : 'text-tierra'}`}>{diferencia === 0 ? 'en el promedio' : `${Math.abs(diferencia)} % ${diferencia < 0 ? 'por debajo' : 'por encima'} del promedio`}</strong> publicado en los últimos 3 meses (S/ {referencia!.toFixed(2)} por kg).</p>}
          <GraficoPrecios serie={historial.serie} actual={precioKg} titulo={`Precio mensual de ${base.toLowerCase()} por kilo`} />
          {historial.serie.some(p => p.ejemplo) && <p className="mt-3 text-xs text-gray-500">Incluye datos de ejemplo de la demostración.</p>}
        </section>}
        <section aria-labelledby="verificacion-lote" className="rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8">
          <h2 id="verificacion-lote" className="mb-5 text-2xl font-normal text-petroleo">Verificación AgroSignal</h2>
          {sello ? <SelloSummary summary={sello} exporting={lot.destino === 'exportacion'} /> : <p className="text-sm text-gray-600">Las verificaciones no están disponibles en este momento.</p>}
          {(profile?.id === lot.productor_id || profile?.rol === 'admin') && <Link href={`/verificaciones/${id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline">Gestionar verificaciones</Link>}
        </section>
      </div>
      {productor && <section aria-labelledby="sobre-productor" className="min-w-0 self-start rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3"><h2 id="sobre-productor" className="text-2xl font-normal text-petroleo">Sobre el productor</h2><Link href={`/marketplace/productor/${productor.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline underline-offset-4">Ver perfil y reseñas</Link></div>
        <ResumenReputacion reputacion={productor.reputacion} nombre={productor.nombre} />
        <p className="mt-5 text-xs leading-relaxed text-gray-500">Calificaciones de compradores con pedidos recibidos. La Verificación AgroSignal revisa el lote; las estrellas cuentan la experiencia de comprarle a quien lo produce.</p>
      </section>}
    </div>
  </AppShell>
}
