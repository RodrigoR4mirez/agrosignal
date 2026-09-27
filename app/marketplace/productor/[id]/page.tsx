import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
import { LotCard } from '@/components/marketplace/LotCard'
import { ResumenReputacion, TarjetaResena } from '@/components/calificaciones/Reputacion'
import { getPerfilProductor, listResenas } from '@/lib/calificaciones/data'
import { getProducerLots } from '@/lib/marketplace/data'
import { esEjemplo, uuidPattern } from '@/lib/marketplace/types'
import { getProfile } from '@/lib/supabase/auth'

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
  return <AppShell profile={profile}>
    <Link href="/marketplace" className="mb-6 inline-block text-sm font-semibold text-[#1a5c2a] underline">← Volver a productos</Link>
    <header className="mb-8 flex flex-wrap items-center gap-5">
      <span aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-full bg-bosque font-display text-4xl text-arena-claro">{productor.nombre.trim().charAt(0).toUpperCase()}</span>
      <div className="min-w-0">
        <h1 className="wrap-anywhere text-4xl font-medium text-bosque">{productor.nombre}</h1>
        <p className="mt-2 text-sm text-gray-600">{[productor.cultivo_principal && `Cultiva ${productor.cultivo_principal.toLowerCase()}`, productor.region, `en AgroSignal desde ${desde}`].filter(Boolean).join(', ')}</p>
      </div>
    </header>
    {ejemplo && <p className="mb-8 rounded-2xl bg-arena-claro px-5 py-4 text-sm text-cacao"><strong>Productor de ejemplo.</strong> Su perfil, sus lotes y sus reseñas son de demostración; no corresponden a una persona real.</p>}
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      <Card className="lg:sticky lg:top-6">
        <h2 className="mb-6 text-xl font-bold">Lo que dicen sus compradores</h2>
        <ResumenReputacion reputacion={productor.reputacion} nombre={productor.nombre} />
        <p className="mt-6 text-xs leading-relaxed text-gray-500">Solo califican compradores con un pedido recibido. Cada calificación se publica cuando ambas partes califican, o 14 días después de la entrega.</p>
      </Card>
      <Card>
        <h2 className="mb-6 text-xl font-bold">Reseñas</h2>
        {resenas.error ? <p role="alert" className="text-sm text-red-800">No pudimos cargar las reseñas. Actualiza la página para intentarlo nuevamente.</p>
          : resenas.resenas.length ? <div>{resenas.resenas.map(resena => <TarjetaResena key={resena.id} resena={resena} />)}</div>
          : <p className="max-w-prose text-sm leading-relaxed text-gray-600">Todavía no hay reseñas publicadas. Aparecen cuando un comprador recibe su pedido y comparte cómo le fue.</p>}
      </Card>
    </div>
    <section className="mt-12" aria-labelledby="lotes-productor">
      <h2 id="lotes-productor" className="mb-5 text-2xl font-medium text-bosque">Cosechas disponibles</h2>
      {lotes.error ? <Card><p role="alert" className="text-sm text-red-800">No pudimos cargar sus lotes.</p></Card>
        : lotes.lots.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{lotes.lots.map(lot => <LotCard key={lot.id} lot={lot} />)}</div>
        : <Card className="bg-arena-claro py-10 text-center"><p className="text-sm text-cacao">{productor.nombre} no tiene lotes disponibles en este momento.</p></Card>}
    </section>
  </AppShell>
}
