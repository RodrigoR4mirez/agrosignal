import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
import { getPublicSello } from '@/lib/sello/data'
import { SelloSummary } from '@/components/sello/SelloSummary'
import { getPublicLot } from '@/lib/marketplace/data'
import { getPerfilProductor } from '@/lib/calificaciones/data'
import { ReputacionCompacta, ResumenReputacion } from '@/components/calificaciones/Reputacion'
import { getProfile } from '@/lib/supabase/auth'
import { COSECHA, descripcionVisible, esEjemplo, money, photoUrl, quantity, uuidPattern } from '@/lib/marketplace/types'

export default async function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const [lot, profile, sello] = await Promise.all([getPublicLot(id), getProfile(), getPublicSello(id)])
  if (!lot) notFound()
  const productor = await getPerfilProductor(lot.productor_id).catch(() => null)
  const ejemplo = esEjemplo(lot)
  const descripcion = descripcionVisible(lot)
  const photos = lot.fotos.flatMap(path => { const url = photoUrl(path); return url ? [url] : [] })
  return <AppShell profile={profile}>
    <Link href="/marketplace" className="mb-6 inline-block text-sm font-semibold text-[#1a5c2a] underline">← Volver a productos</Link>
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">{photos.length ? photos.map((url, index) => <div key={url} className={`relative overflow-hidden rounded-2xl bg-green-50 ${index === 0 ? 'aspect-4/3' : 'aspect-video'}`}><Image src={url} alt={`${lot.cultivo}, foto ${index + 1} de ${photos.length}`} fill unoptimized loading={index === 0 ? 'eager' : 'lazy'} sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>) : <Card>Este lote no tiene fotos disponibles.</Card>}</div>
      <div className="min-w-0 space-y-6">
        <div><p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#b8860f]">{lot.region} · {lot.provincia}</p><h1 className="mb-4 wrap-anywhere text-4xl font-extrabold text-[#1a5c2a]">{lot.cultivo}</h1><p className="mb-4 wrap-anywhere text-3xl font-extrabold">{money(lot.precio_unidad)} <span className="text-base font-normal text-gray-600">por {lot.unidad}</span></p><p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600"><span>Publicado por <Link href={`/marketplace/productor/${lot.productor_id}`} className="font-semibold text-gray-900 underline decoration-arena underline-offset-4 hover:decoration-bosque">{lot.productor_nombre}</Link></span><ReputacionCompacta promedio={lot.productor_promedio} total={lot.productor_calificaciones} /></p></div>
        <Card><h2 className="mb-5 text-xl font-bold">Información de la cosecha</h2><dl className="grid gap-5 text-sm sm:grid-cols-2">{[['Disponible', `${quantity(lot.cantidad_disponible)} ${lot.unidad}`], ['Ubicación', `${lot.distrito}, ${lot.provincia}, ${lot.region}`], ['Estado', COSECHA[lot.estado_cosecha]], ['Destino', lot.destino === 'local' ? 'Mercado local' : 'Exportación'], ['Riesgo declarado por el productor', { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }[lot.nivel_riesgo]], ['Publicado', new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(lot.creado_en))]].map(([label, value]) => <div key={label}><dt className="mb-1 text-gray-500">{label}</dt><dd className="wrap-anywhere font-semibold">{value}</dd></div>)}</dl>{ejemplo && <p className="mt-6 rounded-2xl bg-arena-claro px-5 py-4 text-sm text-cacao"><strong>Lote de ejemplo.</strong> Muestra cómo se ve una publicación en AgroSignal; el productor y la oferta no son reales y no se puede comprar.</p>}{descripcion && <div className="mt-6 border-t border-gray-100 pt-5"><h3 className="mb-2 text-sm font-bold">Descripción</h3><p className="wrap-anywhere whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{descripcion}</p></div>}</Card>
        <Card><h2 className="mb-5 text-xl font-bold">Verificación AgroSignal</h2>{sello ? <SelloSummary summary={sello} exporting={lot.destino === 'exportacion'} /> : <p className="text-sm text-gray-600">Las verificaciones no están disponibles en este momento.</p>}{(profile?.id === lot.productor_id || profile?.rol === 'admin') && <Link href={`/verificaciones/${id}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#1a5c2a] underline">Gestionar verificaciones</Link>}</Card>
        {productor && <Card><div className="mb-5 flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-xl font-bold">Sobre el productor</h2><Link href={`/marketplace/productor/${productor.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-bosque underline underline-offset-4">Ver perfil y reseñas</Link></div><ResumenReputacion reputacion={productor.reputacion} nombre={productor.nombre} /><p className="mt-5 text-xs leading-relaxed text-gray-500">Calificaciones de compradores con pedidos recibidos. El Sello de Inocuidad verifica el lote; las estrellas cuentan la experiencia de comprarle a quien lo produce.</p></Card>}
        {profile?.id === lot.productor_id && <Link href={`/panel-productor/mis-lotes/${id}/editar`} className="inline-flex min-h-11 items-center rounded-xl bg-[#1a5c2a] px-5 py-3 text-sm font-bold text-white">Editar mi lote</Link>}
        {ejemplo ? null : profile?.rol === 'comprador' ? <Link href={`/panel-comprador/comprar/${id}`} className="inline-flex min-h-11 items-center rounded-xl bg-[#1a5c2a] px-6 py-3 text-sm font-bold text-white">Comprar lote</Link> : !profile ? <div className="rounded-xl bg-green-50 p-5"><p className="mb-4 text-sm text-green-950">Ingresa como comprador para enviar tu pedido.</p><Link href={`/login?next=${encodeURIComponent(`/panel-comprador/comprar/${id}`)}`} className="font-semibold text-[#1a5c2a] underline">Ingresar para comprar</Link></div> : null}
      </div>
    </div>
  </AppShell>
}
