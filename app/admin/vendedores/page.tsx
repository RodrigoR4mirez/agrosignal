import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AdminHeading, QueueEmpty, adminDate, adminLink } from '@/components/admin/AdminUI'
import { Estrellas } from '@/components/calificaciones/Reputacion'
import { listVendedoresEnRevision } from '@/lib/calificaciones/data'
import { calificacionesTexto, promedioTexto } from '@/lib/calificaciones/types'
import { requireRole } from '@/lib/supabase/auth'

export default async function SellersReviewPage() {
  await requireRole('admin')
  const data = await listVendedoresEnRevision()
  return <><AdminHeading title="Vendedores en revisión" description="Productores con un promedio menor a 3 estrellas y al menos 5 calificaciones publicadas. Conversa con ellos antes de tomar una decisión sobre su cuenta." />
    <p className="mb-4 text-sm text-gray-600">{data.items.length} {data.items.length === 1 ? 'productor' : 'productores'} en revisión</p>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>Ningún productor está por debajo del umbral. Los compradores están conformes.</QueueEmpty> : <div className="space-y-5">{data.items.map(item => <Card key={item.productor_id} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 text-xl font-bold wrap-anywhere">{item.nombre}</h2>{item.suspendido ? <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">Cuenta suspendida</span> : <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">En revisión</span>}</div>
      <div className="flex flex-wrap items-center gap-3"><span className="font-display text-3xl tabular-nums text-cacao">{promedioTexto(Number(item.promedio))}</span><Estrellas valor={Number(item.promedio)} /><span className="text-sm text-gray-600">{calificacionesTexto(item.total)}</span></div>
      <p className="text-sm text-gray-600 wrap-anywhere">{item.region ?? 'Región no indicada'}, teléfono {item.telefono}. Última calificación: {adminDate(item.ultima)}.</p>
      <div className="flex flex-wrap gap-5"><Link href={`/marketplace/productor/${item.productor_id}`} className={adminLink}>Ver reseñas públicas</Link><Link href={`/admin/usuarios?q=${encodeURIComponent(item.nombre.slice(0, 100))}&rol=productor`} className={adminLink}>Gestionar cuenta</Link></div>
    </Card>)}</div>}
  </>
}
