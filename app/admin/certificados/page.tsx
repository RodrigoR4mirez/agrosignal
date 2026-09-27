import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { AdminHeading, AdminPagination, QueueEmpty, adminDate, adminLink } from '@/components/admin/AdminUI'
import { CertificateReview } from '@/components/sello/SelloForms'
import { listPendingCertificates } from '@/lib/admin/data'
import { requireRole } from '@/lib/supabase/auth'

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const data = await listPendingCertificates(Number(params.pagina))
  return <><AdminHeading title="Certificados pendientes" description="Abre el documento y revisa sus datos antes de decidir. El productor recibirá la decisión y, si corresponde, el motivo del rechazo." />
    <p className="mb-4 text-sm text-gray-600">{data.count} documentos por revisar</p>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>No hay certificados pendientes de revisión.</QueueEmpty> : <div className="space-y-5">{data.items.map(cert => <Card key={cert.id} className="space-y-4"><h2 className="text-xl font-bold wrap-anywhere">{cert.lote.cultivo}</h2><p className="text-sm text-gray-600 wrap-anywhere">{cert.lote.productor_nombre} · {cert.lote.region}</p><p className="text-sm wrap-anywhere"><strong>{cert.tipo === 'global_gap' ? 'GLOBAL G.A.P.' : cert.tipo === 'senasa' ? 'SENASA' : 'Otro'}</strong> · {cert.numero} · vence {adminDate(cert.fecha_vencimiento)}</p>{cert.estado_efectivo === 'vencido' && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">Este documento está vencido. Puedes rechazarlo e indicar al productor que envíe uno vigente.</p>}<div className="flex flex-wrap gap-5">{cert.archivo_firmado ? <a href={cert.archivo_firmado} target="_blank" rel="noopener noreferrer" className={adminLink}>Abrir documento <span className="sr-only">en otra pestaña</span></a> : <p className="text-sm text-amber-900">No pudimos abrir el archivo. Actualiza la página para intentar nuevamente.</p>}<Link href={`/verificaciones/${cert.lote_id}#documental`} className={adminLink}>Ver expediente del lote</Link></div><CertificateReview lotId={cert.lote_id} certificateId={cert.id} allowApprove={cert.estado_efectivo !== 'vencido'} /></Card>)}</div>}
    <AdminPagination base="/admin/certificados" page={data.page} count={data.count} />
  </>
}
