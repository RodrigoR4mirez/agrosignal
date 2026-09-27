import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { PurchaseForm } from '@/components/transacciones/PurchaseForm'
import { requireRole } from '@/lib/supabase/auth'
import { getPublicLot } from '@/lib/marketplace/data'
import { esEjemplo, uuidPattern } from '@/lib/marketplace/types'

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole('comprador')
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const lot = await getPublicLot(id)
  if (!lot || esEjemplo(lot)) notFound()
  return <AppShell profile={profile}><div className="mx-auto w-full max-w-2xl"><Link href={`/marketplace/${id}`} className="mb-5 inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline">← Volver al lote</Link><h1 className="mb-3 text-3xl font-normal sm:text-4xl text-petroleo">Comprar cosecha</h1><p className="mb-8 text-sm text-gray-600 wrap-anywhere">{lot.cultivo} · {lot.region} · {lot.productor_nombre}</p><PurchaseForm lotId={id} crop={lot.cultivo} unit={lot.unidad} price={Number(lot.precio_unidad)} stock={Number(lot.cantidad_disponible)} requestId={crypto.randomUUID()} /></div></AppShell>
}
