import Link from 'next/link'
import { requireRole } from '@/lib/supabase/auth'
import { getOwnLots } from '@/lib/marketplace/data'
import { AppShell } from '@/components/AppShell'
import { listOrders, listNotifications } from '@/lib/transacciones/data'
import { OrderList } from '@/components/transacciones/OrderList'
import { Notifications } from '@/components/transacciones/Notifications'
import { Card } from '@/components/ui/Card'
export default async function ProducerPanel({ searchParams }: { searchParams: Promise<{ aviso?: string; pagina?: string; avisos?: string }> }) {
  const profile = await requireRole('productor')
  const params = await searchParams
  const [result, orders, notifications] = await Promise.all([getOwnLots(profile.id), listOrders(profile, Number(params.pagina) || 1), listNotifications(Number(params.avisos) || 1)])
  return <AppShell profile={profile}>
    {params.aviso === 'sin-permiso' && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No tienes permiso para ver esta página.</p>}
    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#b8860f]">Mi espacio · Productor</p><h1 className="mb-8 text-3xl font-extrabold text-[#1a5c2a] wrap-anywhere">Hola, {profile.nombre_completo}</h1>
    <div className="grid gap-6 md:grid-cols-2"><Card><h2 className="mb-3 text-xl font-bold">Tus cosechas en AgroSignal</h2><p className="mb-5 text-sm text-gray-600">{result.error ? 'No pudimos cargar el resumen. Puedes volver a intentarlo desde Mis lotes.' : `Tienes ${result.lots.length} lotes guardados. Gestiona tus publicaciones, borradores y lotes agotados.`}</p><div className="flex flex-wrap gap-3"><Link href="/panel-productor/publicar" className="rounded-xl bg-[#1a5c2a] px-5 py-3 text-sm font-bold text-white">Publicar lote</Link><Link href="/panel-productor/mis-lotes" className="rounded-xl border border-green-700 px-5 py-3 text-sm font-semibold text-[#1a5c2a]">Mis lotes</Link></div></Card><Card><h2 className="mb-3 text-xl font-bold">Información para tu campo</h2><p className="mb-5 text-sm leading-relaxed text-gray-600">Consulta el riesgo climático y compara las cosechas disponibles de tu región.</p><div className="flex flex-wrap gap-5 text-sm font-semibold text-[#1a5c2a]"><Link href="/" className="underline">Riesgo climático</Link><Link href="/marketplace" className="underline">Ver marketplace</Link><Link href="/actualizar-password" className="underline">Cambiar contraseña</Link></div></Card></div>
    <div className="mt-8 space-y-8"><OrderList {...orders} role="productor" notificationsPage={notifications.page} /><Notifications {...notifications} role="productor" ordersPage={orders.page} /></div>
  </AppShell>
}
