import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AdminHeading, AdminPagination, QueueEmpty, adminDate, adminLink } from '@/components/admin/AdminUI'
import { listFailedTests } from '@/lib/admin/data'
import { requireRole } from '@/lib/supabase/auth'

export default async function FailedTestsPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const data = await listFailedTests(Number(params.pagina))
  return <><AdminHeading title="Tests de residuos fallidos" description="Los lotes con un resultado No pasa permanecen fuera del catálogo. Los resultados y su evidencia se conservan para seguimiento." />
    <p className="mb-4 text-sm text-gray-600">{data.count} resultados No pasa</p>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>No hay tests fallidos registrados.</QueueEmpty> : <div className="space-y-5">{data.items.map(test => <Card key={test.id} className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 text-xl font-bold wrap-anywhere">{test.lote.cultivo}</h2><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-900">Lote bloqueado</span></div><p className="text-sm text-gray-600 wrap-anywhere">{test.lote.productor_nombre} · {test.lote.region}</p><p className="text-sm wrap-anywhere">Kit: {test.tipo_kit} · prueba del {adminDate(test.fecha_prueba)}</p><div className="flex flex-wrap gap-5">{test.foto_firmada && <a href={test.foto_firmada} target="_blank" rel="noopener noreferrer" className={adminLink}>Abrir foto del resultado <span className="sr-only">en otra pestaña</span></a>}<Link href={`/verificaciones/${test.lote_id}#residuos`} className={adminLink}>Ver historial del lote</Link></div></Card>)}</div>}
    <AdminPagination base="/admin/tests" page={data.page} count={data.count} />
  </>
}
