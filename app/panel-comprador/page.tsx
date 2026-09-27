import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { OrderList } from '@/components/transacciones/OrderList'
import { Notifications } from '@/components/transacciones/Notifications'
import { requireRole } from '@/lib/supabase/auth'
import { listOrders, listNotifications } from '@/lib/transacciones/data'

export default async function BuyerPanel({ searchParams }: { searchParams: Promise<{ aviso?: string; pagina?: string; avisos?: string }> }) {
  const profile = await requireRole('comprador')
  const params = await searchParams
  const [orders, notifications] = await Promise.all([listOrders(profile, Number(params.pagina) || 1), listNotifications(Number(params.avisos) || 1)])
  return <AppShell profile={profile}>
    {params.aviso === 'sin-permiso' && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No tienes permiso para ver esta página.</p>}
    <div className="mb-8 flex flex-wrap items-center justify-between gap-5"><div className="min-w-0"><p className="mb-2 text-sm font-semibold text-tierra">Mi espacio · Comprador</p><h1 className="text-3xl font-normal sm:text-4xl text-petroleo wrap-anywhere">Hola, {profile.nombre_completo}</h1></div><Link href="/marketplace" className="rounded-xl bg-petroleo px-5 py-3 text-sm font-bold text-white">Explorar cosechas</Link></div>
    <div className="space-y-8"><OrderList {...orders} role="comprador" notificationsPage={notifications.page} /><Notifications {...notifications} role="comprador" ordersPage={orders.page} /><Link href="/actualizar-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline">Cambiar contraseña</Link></div>
  </AppShell>
}
