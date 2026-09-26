import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
import { DeleteLot } from '@/components/marketplace/DeleteLot'
import { requireRole } from '@/lib/supabase/auth'
import { getOwnLots } from '@/lib/marketplace/data'
import { money, quantity } from '@/lib/marketplace/types'
export default async function OwnLots({ searchParams }: { searchParams: Promise<{ guardado?: string; eliminado?: string; limpieza?: string }> }) {
  const profile = await requireRole('productor')
  const [params, result] = await Promise.all([searchParams, getOwnLots(profile.id)])
  return <AppShell profile={profile}>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><Link href="/panel-productor" className="text-sm font-semibold text-[#1a5c2a] underline">← Mi panel</Link><h1 className="mt-3 text-3xl font-extrabold text-[#1a5c2a]">Mis lotes</h1></div><Link href="/panel-productor/publicar" className="rounded-xl bg-[#1a5c2a] px-5 py-3 text-sm font-bold text-white">Publicar lote</Link></div>
    {(params.guardado || params.eliminado) && <p role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950">{params.eliminado ? 'Lote eliminado correctamente.' : 'Lote guardado correctamente.'}{params.limpieza && ' No pudimos limpiar algunas fotos almacenadas; el cambio del lote ya está guardado.'}</p>}
    {result.error ? <Card><p role="alert" className="text-sm text-red-800">No pudimos cargar tus lotes. Intenta nuevamente.</p></Card> : result.lots.length ? <div className="grid gap-6 md:grid-cols-2">{result.lots.map(lot => <Card key={lot.id}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 wrap-anywhere text-xl font-bold text-[#1a5c2a]">{lot.cultivo}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${lot.bloqueado ? 'bg-red-50 text-red-800' : lot.borrador || Number(lot.cantidad_disponible) === 0 ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-900'}`}>{lot.bloqueado ? 'Bloqueado' : lot.borrador ? 'Borrador' : Number(lot.cantidad_disponible) === 0 ? 'Agotado' : 'Publicado'}</span></div>
      <p className="mb-2 wrap-anywhere text-sm text-gray-600">{lot.region} · {lot.provincia}, {lot.distrito}</p><p className="mb-5 text-sm font-semibold">{quantity(lot.cantidad_disponible)} {lot.unidad} · {money(lot.precio_unidad)} / {lot.unidad}</p>
      {lot.borrador && <p className="mb-4 text-sm text-gray-600">Completa tus fotos y publica el lote para que aparezca en el marketplace.</p>}
      <div className="flex flex-wrap gap-3"><Link href={`/panel-productor/mis-lotes/${lot.id}/editar`} className="inline-flex min-h-11 items-center rounded-lg border border-green-700 px-3 text-sm font-semibold text-[#1a5c2a]">{lot.borrador ? 'Continuar publicación' : 'Editar'}</Link>{!lot.borrador && !lot.bloqueado && Number(lot.cantidad_disponible) > 0 && <Link href={`/marketplace/${lot.id}`} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[#1a5c2a] underline">Ver publicación</Link>}<Link href={`/verificaciones/${lot.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-amber-600 px-3 text-sm font-semibold text-amber-900">Verificaciones</Link><DeleteLot id={lot.id} crop={lot.cultivo} /></div>
    </Card>)}</div> : <Card className="py-12 text-center"><h2 className="mb-3 text-xl font-bold">Tu primera cosecha empieza aquí</h2><p className="mb-6 text-sm text-gray-600">Publica un lote con su ubicación, precio y fotos.</p><Link href="/panel-productor/publicar" className="font-semibold text-[#1a5c2a] underline">Publicar mi primer lote</Link></Card>}
  </AppShell>
}
