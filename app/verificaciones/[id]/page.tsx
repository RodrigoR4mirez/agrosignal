import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
import { SelloSummary } from '@/components/sello/SelloSummary'
import { CertificateForm, CertificateReview, DronRequest, DronResultForm, TestForm } from '@/components/sello/SelloForms'
import { requireRole } from '@/lib/supabase/auth'
import { getSelloManagement } from '@/lib/sello/data'
import { hoyLima } from '@/lib/sello/types'

const certificateNames = { senasa: 'SENASA (BPA u otro)', global_gap: 'GLOBAL G.A.P.', otro: 'Otro' }
const certificateStates = { en_revision: 'En revisión', aprobado: 'Aprobado', rechazado: 'Rechazado', vencido: 'Vencido' }
const date = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
function EvidenceLink({ url, children }: { url: string | null; children: React.ReactNode }) {
  return url ? <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#1a5c2a] underline">{children} <span className="sr-only">(se abre en otra pestaña)</span></a> : <p className="text-sm text-amber-800">No pudimos abrir la evidencia. Actualiza la página para intentarlo nuevamente.</p>
}

export default async function VerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole(['productor', 'admin'])
  const { id } = await params
  const data = await getSelloManagement(id)
  if (!data) notFound()
  const admin = profile.rol === 'admin'
  const props = { lotId: id, owner: data.lote.productor_id, today: hoyLima() }
  const pendingDrone = data.inspecciones.some(row => row.estado === 'solicitado')
  return <AppShell profile={profile}>
    <div className="mb-8 space-y-4"><Link href={admin ? '/admin' : '/panel-productor/mis-lotes'} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#1a5c2a] underline">← {admin ? 'Administración' : 'Mis lotes'}</Link><p className="text-xs font-bold uppercase tracking-wide text-[#b8860f]">Verificación AgroSignal</p><h1 className="text-3xl font-extrabold text-[#1a5c2a] wrap-anywhere">Verificaciones de {data.lote.cultivo}</h1><p className="text-sm text-gray-600">{data.lote.region} · {data.lote.provincia}, {data.lote.distrito}</p></div>
    {data.resumen.bloqueado && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm leading-relaxed text-red-950">Lote bloqueado. Un resultado No pasa lo retira del marketplace y evita nuevos pedidos. Registrar otro test no elimina este bloqueo.</p>}
    <Card className="mb-8"><SelloSummary summary={data.resumen} exporting={data.lote.destino === 'exportacion'} /></Card>
    <nav aria-label="Niveles de verificación" className="mb-8 flex flex-wrap gap-3 text-sm font-semibold text-[#1a5c2a]"><a href="#documental" className="rounded-xl border border-green-700 px-4 py-3">1. Documentos</a><a href="#dron" className="rounded-xl border border-green-700 px-4 py-3">2. Inspección con dron</a><a href="#residuos" className="rounded-xl border border-green-700 px-4 py-3">3. Test de residuos</a></nav>
    <div className="space-y-8">
      <section id="documental" className="scroll-mt-6 space-y-5" aria-labelledby="documental-title"><h2 id="documental-title" className="text-2xl font-bold text-[#1a5c2a]">Nivel 1 · Verificación documental</h2>
        {!admin && <Card><h3 className="mb-5 text-lg font-bold">Enviar certificado</h3><CertificateForm {...props} /></Card>}
        {data.certificados.length ? data.certificados.map(cert => <Card key={cert.id} className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-lg font-bold wrap-anywhere">{certificateNames[cert.tipo]} · {cert.numero}</h3><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{certificateStates[cert.estado_efectivo]}</span></div><p className="text-sm text-gray-600">Vence el {date(cert.fecha_vencimiento)}</p>{cert.motivo_rechazo && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-900 wrap-anywhere">Motivo: {cert.motivo_rechazo}</p>}<EvidenceLink url={cert.archivo_firmado}>Abrir certificado</EvidenceLink>{admin && cert.estado === 'en_revision' && <CertificateReview lotId={id} certificateId={cert.id} allowApprove={cert.estado_efectivo !== 'vencido'} />}</Card>) : <p className="text-sm text-gray-600">Todavía no hay certificados registrados.</p>}
      </section>
      <section id="dron" className="scroll-mt-6 space-y-5" aria-labelledby="dron-title"><h2 id="dron-title" className="text-2xl font-bold text-[#1a5c2a]">Nivel 2 · Inspección con dron</h2>
        {!admin && !pendingDrone && !data.lote.borrador && !data.resumen.bloqueado && <Card><DronRequest lotId={id} /></Card>}
        {data.inspecciones.length ? data.inspecciones.map(inspection => <Card key={inspection.id} className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Inspección #{inspection.id.slice(0, 8)}</h3><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">{inspection.estado === 'completado' ? 'Completada' : 'Solicitada'}</span></div>{inspection.estado === 'solicitado' ? admin ? <DronResultForm {...props} inspectionId={inspection.id} /> : <p className="text-sm text-gray-600">La solicitud está pendiente de coordinación y registro del vuelo.</p> : <><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-gray-500">Fecha del vuelo</dt><dd className="mt-1">{inspection.fecha_vuelo ? date(inspection.fecha_vuelo) : 'Sin fecha'}</dd></div><div><dt className="text-gray-500">Coordenadas GPS</dt><dd className="mt-1 wrap-anywhere">{inspection.coordenadas_gps}</dd></div></dl>{inspection.notas && <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{inspection.notas}</p>}<ul className="space-y-2">{inspection.evidencia_firmada.map((evidence, index) => <li key={evidence.path}><EvidenceLink url={evidence.url}>Abrir evidencia {index + 1}</EvidenceLink></li>)}</ul></>}</Card>) : <p className="text-sm text-gray-600">Todavía no se solicitó una inspección para este lote.</p>}
      </section>
      <section id="residuos" className="scroll-mt-6 space-y-5" aria-labelledby="residuos-title"><h2 id="residuos-title" className="text-2xl font-bold text-[#1a5c2a]">Nivel 3 · Test de residuos</h2>
        {admin ? <Card><h3 className="mb-5 text-lg font-bold">Registrar test de tiras reactivas</h3><TestForm {...props} /></Card> : <p className="text-sm text-gray-600">La administración registra los resultados y la evidencia de los tests realizados.</p>}
        {data.tests.length ? data.tests.map(test => <Card key={test.id} className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-lg font-bold wrap-anywhere">{test.tipo_kit}</h3><span className={`rounded-full px-3 py-1 text-xs font-bold ${test.resultado === 'pasa' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>{test.resultado === 'pasa' ? 'Pasa' : 'No pasa'}</span></div><p className="text-sm text-gray-600">Prueba del {date(test.fecha_prueba)}</p><EvidenceLink url={test.foto_firmada}>Abrir foto del resultado</EvidenceLink></Card>) : <p className="text-sm text-gray-600">Todavía no se registraron tests de residuos.</p>}
      </section>
    </div>
    <p className="mt-8 text-xs leading-relaxed text-gray-500">Los enlaces de evidencia son privados y temporales. Si uno vence, actualiza esta página para abrirlo de nuevo.</p>
  </AppShell>
}
