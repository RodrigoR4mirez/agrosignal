import Link from 'next/link'
import { Metrica } from '@/components/ui/Card'
import { tituloBloque } from '@/components/ui/estilos'
import { AdminHeading, QueueEmpty, adminLink } from '@/components/admin/AdminUI'
import { Notifications } from '@/components/transacciones/Notifications'
import { listNotifications } from '@/lib/transacciones/data'
import { getAdminMetrics } from '@/lib/admin/data'
import { requireRole } from '@/lib/supabase/auth'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ aviso?: string; avisos?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const [data, notices] = await Promise.all([getAdminMetrics(), listNotifications(Number(params.avisos))])
  const metrics = data.metrics
  return <>
    <AdminHeading title="Administración" description="Revisa las solicitudes, acompaña las transacciones y mantén al día las cuentas de la comunidad." />
    {params.aviso === 'sin-permiso' && <p role="alert" className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">Esta sección no corresponde a tu tipo de cuenta. Desde aquí puedes gestionar la plataforma.</p>}
    {data.error || !metrics ? <QueueEmpty error>No hay métricas disponibles.</QueueEmpty> : <>
      <div className="grid gap-4 sm:grid-cols-3">{[
        ['Lotes activos', metrics.lotes_activos, 'Disponibles en el catálogo público'],
        ['Transacciones del mes', metrics.pedidos_mes, 'Pedidos creados, incluidos cancelados'],
        ['Usuarios nuevos', metrics.usuarios_nuevos, 'Cuentas registradas este mes'],
      ].map(([label, value, hint]) => <Metrica key={label} etiqueta={label} valor={value} nota={hint} />)}</div>
      <p className="mt-3 text-xs text-gray-500">Mes calendario según la hora de Perú. Los importes de los pedidos no representan pagos procesados por AgroSignal.</p>
      <h2 className={`mb-4 mt-8 ${tituloBloque}`}>Requieren seguimiento</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ['/admin/certificados', 'Certificados pendientes', metrics.certificados_pendientes],
        ['/admin/drones', 'Inspecciones solicitadas', metrics.drones_pendientes],
        ['/admin/tests', 'Lotes bloqueados', metrics.lotes_bloqueados],
        ['/admin/vendedores', 'Vendedores en revisión', metrics.vendedores_en_revision ?? 0],
      ].map(([href, label, value]) => <Metrica key={href} etiqueta={label} valor={value} nota={<Link href={String(href)} className={adminLink}>Revisar<span className="sr-only"> {String(label).toLowerCase()}</span></Link>} />)}</div>
    </>}
    <section className="mt-8"><Notifications {...notices} role="admin" /></section>
  </>
}
