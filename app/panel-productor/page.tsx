import Link from 'next/link'
import { requireRole } from '@/lib/supabase/auth'
import { getOwnLots } from '@/lib/marketplace/data'
import { AppShell } from '@/components/AppShell'
import { listOrders, listNotifications } from '@/lib/transacciones/data'
import { OrderList } from '@/components/transacciones/OrderList'
import { Notifications } from '@/components/transacciones/Notifications'
import { Card } from '@/components/ui/Card'
import { FotoPerfil } from '@/components/perfil/FotoPerfil'
import { PerfilFincaForm } from '@/components/perfil/PerfilFincaForm'
import { CobrosMercadoPago } from '@/components/pagos/CobrosMercadoPago'
import { configMercadoPago } from '@/lib/pagos/mercadopago'
import { createClient } from '@/lib/supabase/server'
export default async function ProducerPanel({ searchParams }: { searchParams: Promise<{ aviso?: string; pagina?: string; avisos?: string; mp?: string }> }) {
  const profile = await requireRole('productor')
  const params = await searchParams
  const [result, orders, notifications] = await Promise.all([getOwnLots(profile.id), listOrders(profile, Number(params.pagina) || 1), listNotifications(Number(params.avisos) || 1)])
  const cobros = configMercadoPago() ? (await (await createClient()).rpc('estado_mercadopago', { p_productor_id: profile.id })).data as { conectado: boolean; conectado_en: string | null; modo_prueba: boolean } | null : null
  return <AppShell profile={profile}>
    {params.aviso === 'sin-permiso' && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No tienes permiso para ver esta página.</p>}
    <p className="mb-2 text-sm font-semibold text-tierra">Mi espacio · Productor</p><h1 className="mb-8 text-3xl font-normal sm:text-4xl text-petroleo wrap-anywhere">Hola, {profile.nombre_completo}</h1>
    <div className="grid gap-6 md:grid-cols-2"><Card><h2 className="mb-3 text-xl font-semibold">Tus cosechas en AgroSignal</h2><p className="mb-5 text-sm text-gray-600">{result.error ? 'No pudimos cargar el resumen. Puedes volver a intentarlo desde Mis lotes.' : `Tienes ${result.lots.length} lotes guardados. Gestiona tus publicaciones, borradores y lotes agotados.`}</p><div className="flex flex-wrap gap-3"><Link href="/panel-productor/publicar" className="rounded-xl bg-petroleo px-5 py-3 text-sm font-bold text-white">Publicar lote</Link><Link href="/panel-productor/mis-lotes" className="rounded-xl border border-petroleo/40 px-5 py-3 text-sm font-semibold text-petroleo">Mis lotes</Link></div></Card><Card><h2 className="mb-3 text-xl font-semibold">Tu mercado</h2><p className="mb-5 text-sm leading-relaxed text-gray-600">Compara precios y cosechas que otros productores publican en tu región.</p><div className="flex flex-wrap gap-5 text-sm font-semibold text-petroleo"><Link href="/marketplace" className="underline">Ver marketplace</Link><Link href="/actualizar-password" className="underline">Cambiar contraseña</Link></div></Card></div>
    <Card className="mt-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="mb-1 text-xl font-semibold">Tu perfil público</h2><p className="text-sm text-gray-600">Los compradores lo ven al tocar tu nombre en el catálogo. Un perfil completo genera más confianza.</p></div><Link href={`/marketplace/productor/${profile.id}`} className="text-sm font-semibold text-petroleo underline underline-offset-4">Ver mi perfil público</Link></div>
      <FotoPerfil owner={profile.id} nombre={profile.nombre_completo} foto={profile.foto ?? null} />
      <details className="group mt-6 border-t border-[#f0ebdf] pt-5" open={!profile.finca}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-petroleo [&::-webkit-details-marker]:hidden">Datos de tu finca<span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-crema transition-transform group-open:rotate-45">+</span></summary>
        <div className="mt-5"><PerfilFincaForm inicial={profile} /></div>
      </details>
    </Card>
    {cobros && <CobrosMercadoPago conectado={cobros.conectado} conectadoEn={cobros.conectado_en} modoPrueba={cobros.modo_prueba} aviso={params.mp} />}
    <div className="mt-8 space-y-8"><OrderList {...orders} role="productor" notificationsPage={notifications.page} /><Notifications {...notifications} role="productor" ordersPage={orders.page} /></div>
  </AppShell>
}
