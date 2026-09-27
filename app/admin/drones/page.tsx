import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AdminHeading, AdminPagination, QueueEmpty, adminDate, adminLink } from '@/components/admin/AdminUI'
import { DronResultForm } from '@/components/sello/SelloForms'
import { listPendingDrones } from '@/lib/admin/data'
import { hoyLima } from '@/lib/sello/types'
import { requireRole } from '@/lib/supabase/auth'

export default async function DronesPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const data = await listPendingDrones(Number(params.pagina))
  return <><AdminHeading title="Solicitudes de dron" description="Coordina la inspección con el productor y registra el resultado cuando el vuelo se haya realizado." />
    <p className="mb-4 text-sm text-gray-600">{data.count} inspecciones pendientes</p>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>No hay inspecciones pendientes.</QueueEmpty> : <div className="space-y-5">{data.items.map(drone => <Card key={drone.id} className="space-y-4"><h2 className="text-xl font-bold wrap-anywhere">{drone.lote.cultivo}</h2><p className="text-sm text-gray-600 wrap-anywhere">{drone.lote.productor_nombre} · {drone.lote.region}</p><p className="text-sm wrap-anywhere">Contacto del productor: {drone.lote.productor_telefono || 'Sin teléfono indicado'}</p><p className="text-xs text-gray-500">Solicitada el {adminDate(drone.creado_en)} · #{drone.id.slice(0, 8)}</p>{drone.lote.bloqueado && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900">Este lote está bloqueado. Una inspección completada no retira el bloqueo.</p>}<Link href={`/verificaciones/${drone.lote_id}#dron`} className={adminLink}>Ver expediente del lote</Link><details className="rounded-xl border border-gray-200 p-4"><summary className="cursor-pointer py-2 text-sm font-bold text-[#1a5c2a]">Registrar resultado del vuelo</summary><div className="mt-5"><DronResultForm lotId={drone.lote_id} owner={drone.lote.productor_id} today={hoyLima()} inspectionId={drone.id} /></div></details></Card>)}</div>}
    <AdminPagination base="/admin/drones" page={data.page} count={data.count} />
  </>
}
