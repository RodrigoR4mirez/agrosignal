import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { CabeceraPanel } from '@/components/CabeceraPanel'
import { OrderList } from '@/components/transacciones/OrderList'
import { Notifications } from '@/components/transacciones/Notifications'
import { AlertasPrecio } from '@/components/comunidad/AlertasPrecio'
import { PerfilCompradorForm } from '@/components/comunidad/PerfilCompradorForm'
import { Avatar } from '@/components/perfil/Avatar'
import { FotoPerfil } from '@/components/perfil/FotoPerfil'
import { Card } from '@/components/ui/Card'
import { buttonPrimaryClass, buttonSecondaryClass, tituloBloque } from '@/components/ui/estilos'
import { listAlertas, listSeguidos } from '@/lib/comunidad/data'
import { requireRole } from '@/lib/supabase/auth'
import { listOrders, listNotifications } from '@/lib/transacciones/data'

export default async function BuyerPanel({ searchParams }: { searchParams: Promise<{ aviso?: string; pagina?: string; avisos?: string }> }) {
  const profile = await requireRole('comprador')
  const params = await searchParams
  const [orders, notifications, seguidos, alertas] = await Promise.all([listOrders(profile, Number(params.pagina) || 1), listNotifications(Number(params.avisos) || 1), listSeguidos(), listAlertas()])
  return <AppShell profile={profile}>
    {params.aviso === 'sin-permiso' && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No tienes permiso para ver esta página.</p>}
    <CabeceraPanel antetitulo="Mi espacio · Comprador" titulo={`Hola, ${profile.nombre_completo}`}><Link href="/marketplace/precios" className={buttonSecondaryClass}>Ver precios</Link><Link href="/marketplace" className={buttonPrimaryClass}>Explorar cosechas</Link></CabeceraPanel>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="min-w-0">
        <h2 className={`mb-1 ${tituloBloque}`}>Productores que sigues</h2>
        <p className="mb-5 text-sm text-gray-600">Te avisamos cuando publican un lote o bajan un precio.</p>
        {seguidos.error ? <p role="alert" className="text-sm text-red-800">No pudimos cargar la lista.</p>
          : seguidos.productores.length ? <ul className="divide-y divide-linea-suave">{seguidos.productores.map(p => <li key={p.id}>
            <Link href={`/marketplace/productor/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-crema/60">
              <Avatar nombre={p.nombre} foto={p.foto} className="size-11 text-sm" />
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-gray-900">{p.nombre}</span><span className="block truncate text-xs text-gray-500">{[p.finca, p.cultivo_principal, p.region].filter(Boolean).join(' · ')}</span></span>
              <span className="shrink-0 rounded-full bg-crema px-3 py-1 text-xs font-semibold text-petroleo">{p.lotes_activos} {p.lotes_activos === 1 ? 'lote' : 'lotes'}</span>
            </Link></li>)}</ul>
          : <p className="text-sm text-gray-600">Aún no sigues a nadie. Entra al perfil de un productor y toca <strong className="font-semibold">Seguir</strong>.</p>}
      </Card>
      <Card className="min-w-0">
        <h2 className={`mb-1 ${tituloBloque}`}>Alertas de precio</h2>
        <p className="mb-5 text-sm text-gray-600">Te avisamos cuando se publique o rebaje un cultivo que buscas, dentro de tu precio.</p>
        <AlertasPrecio alertas={alertas.alertas} />
      </Card>
    </div>

    <Card className="mt-6" id="perfil-comprador">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className={`mb-1 ${tituloBloque}`}>Tu perfil de comprador</h2><p className="text-sm text-gray-600">Lo ven los productores con los que tienes pedidos, junto con la calificación que te dan. Un perfil completo acelera la confirmación de tus pedidos.</p></div><Link href={`/compradores/${profile.id}`} className="text-sm font-semibold text-petroleo underline underline-offset-4">Ver cómo lo ven</Link></div>
      <FotoPerfil owner={profile.id} nombre={profile.nombre_completo} foto={profile.foto ?? null} />
      <details className="group mt-6 border-t border-linea-suave pt-5" open={!profile.rubro}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-petroleo [&::-webkit-details-marker]:hidden">Datos de tu compra<span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-crema transition-transform group-open:rotate-45">+</span></summary>
        <div className="mt-5"><PerfilCompradorForm inicial={profile} /></div>
      </details>
    </Card>

    <div className="mt-8 space-y-8"><OrderList {...orders} role="comprador" notificationsPage={notifications.page} /><Notifications {...notifications} role="comprador" ordersPage={orders.page} /><Link href="/actualizar-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-petroleo underline">Cambiar contraseña</Link></div>
  </AppShell>
}
