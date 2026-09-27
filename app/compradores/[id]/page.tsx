import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Avatar } from '@/components/perfil/Avatar'
import { CurvasNivel } from '@/components/landing/Iconos'
import { Estrellas, ResumenReputacion } from '@/components/calificaciones/Reputacion'
import { getPerfilComprador } from '@/lib/comunidad/data'
import { TIPO_COMPRADOR } from '@/lib/comunidad/types'
import { promedioTexto } from '@/lib/calificaciones/types'
import { uuidPattern } from '@/lib/marketplace/types'
import { numero } from '@/lib/perfil/types'
import { requireRole } from '@/lib/supabase/auth'

export const metadata: Metadata = { title: 'Perfil del comprador | AgroSignal', robots: { index: false } }
const tarjeta = 'rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-8'
const fecha = (iso: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(iso))

// Perfil privado del comprador: lo ven él mismo, la administración y los productores con pedidos suyos.
export default async function CompradorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const profile = await requireRole()
  const comprador = await getPerfilComprador(id)
  if (!comprador) notFound()
  if (comprador === 'sin-permiso') return <AppShell profile={profile}><div className={`${tarjeta} mx-auto max-w-xl text-center`}><h1 className="text-2xl font-normal text-petroleo">Perfil reservado</h1><p className="mt-3 text-sm text-gray-600">Solo ven el perfil de un comprador los productores que tienen pedidos con él.</p><Link href={profile.rol === 'productor' ? '/panel-productor' : '/marketplace'} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-naranja px-6 text-sm font-semibold text-petroleo">Volver</Link></div></AppShell>
  const { reputacion } = comprador
  const propio = profile.id === comprador.id
  const datos: [string, string][] = [
    ['Tipo de comprador', comprador.tipo_comprador ? TIPO_COMPRADOR[comprador.tipo_comprador] : '—'],
    ...(comprador.rubro ? [['Rubro', comprador.rubro] as [string, string]] : []),
    ...(comprador.volumen_mensual_kg ? [['Volumen que compra', `${numero(Number(comprador.volumen_mensual_kg))} kg al mes`] as [string, string]] : []),
    ['Compra para exportar', comprador.destino_exportacion ? 'Sí' : 'No'],
    ...(comprador.region ? [['Región', comprador.region] as [string, string]] : []),
  ]
  return <AppShell profile={profile}>
    {propio && <p className="mb-4 rounded-2xl bg-crema px-5 py-3 text-sm text-petroleo">Así ven tu perfil los productores con los que tienes pedidos. <Link href="/panel-comprador#perfil-comprador" className="font-semibold underline">Editarlo</Link></p>}
    <header className="relative isolate overflow-hidden rounded-[28px] bg-petroleo p-6 text-white sm:p-10">
      <CurvasNivel className="absolute -right-24 -top-28 -z-10 w-[34rem] opacity-40" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar nombre={comprador.nombre} foto={comprador.foto} className="size-24 text-2xl ring-4 ring-white/25" />
          <div className="min-w-0">
            {comprador.empresa && <p className="text-sm font-semibold text-trigo">{comprador.empresa}</p>}
            <h1 className="mt-1 wrap-anywhere text-4xl font-normal leading-tight text-white">{comprador.nombre}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/80">
              {reputacion.promedio !== null && reputacion.total >= 3 ? <><Estrellas valor={reputacion.promedio} tamano={16} /><span className="font-semibold text-white">{promedioTexto(reputacion.promedio)}</span><span>· {reputacion.total} {reputacion.total === 1 ? 'calificación de productores' : 'calificaciones de productores'}</span></> : <span>{reputacion.total ? `${reputacion.total} ${reputacion.total === 1 ? 'calificación' : 'calificaciones'} de productores` : 'Aún sin calificaciones de productores'}</span>}
              <span>· Comprador desde {new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'America/Lima' }).format(new Date(comprador.creado_en))}</span>
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-2 text-center sm:gap-3">
          {[[numero(comprador.pedidos_completados), 'compras completadas'], [numero(comprador.productores_distintos), 'productores distintos'], [comprador.pedidos_totales ? `${Math.round((comprador.pedidos_completados / comprador.pedidos_totales) * 100)} %` : '—', 'pedidos que llegan a término']].map(([valor, etiqueta]) =>
            <div key={etiqueta} className="flex min-w-24 flex-col-reverse rounded-2xl bg-white/10 px-3 py-4 ring-1 ring-white/20 backdrop-blur-md sm:min-w-32"><dt className="mt-1 text-[11px] text-white/70">{etiqueta}</dt><dd className="text-xl font-semibold text-white">{valor}</dd></div>)}
        </dl>
      </div>
    </header>
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
      <div className="min-w-0 space-y-6">
        <section aria-labelledby="sobre" className={tarjeta}>
          <h2 id="sobre" className="text-2xl font-normal text-petroleo">Qué compra</h2>
          {comprador.sobre_mi && <p className="mt-4 max-w-[65ch] whitespace-pre-line text-[15px] leading-relaxed text-gray-700">{comprador.sobre_mi}</p>}
          <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">{datos.map(([k, v]) => <div key={k} className="border-b border-[#f0ebdf] pb-3"><dt className="text-gray-500">{k}</dt><dd className="mt-0.5 font-semibold text-gray-900">{v}</dd></div>)}</dl>
          {comprador.cultivos_interes.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-petroleo">Cultivos que busca</h3><ul className="mt-3 flex flex-wrap gap-2">{comprador.cultivos_interes.map(c => <li key={c} className="rounded-full bg-musgo/12 px-3 py-1.5 text-sm text-petroleo">{c}</li>)}</ul></div>}
          {comprador.mercados_destino.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-petroleo">Destinos de su compra</h3><ul className="mt-3 flex flex-wrap gap-2">{comprador.mercados_destino.map(c => <li key={c} className="rounded-full bg-crema px-3 py-1.5 text-sm text-petroleo ring-1 ring-[#ebe4d4]">{c}</li>)}</ul></div>}
        </section>
        <section aria-labelledby="opiniones" className={tarjeta}>
          <h2 id="opiniones" className="mb-2 text-2xl font-normal text-petroleo">Lo que dicen los productores</h2>
          {comprador.resenas.length ? <ul className="divide-y divide-[#f0ebdf]">{comprador.resenas.map((r, i) => <li key={i} className="py-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-gray-900">{r.autor}</p><p className="text-xs text-gray-500">{fecha(r.creado_en)}</p></div><Estrellas valor={r.estrellas} tamano={14} className="mt-1" />{r.comentario && <p className="mt-2 text-[15px] leading-relaxed text-gray-700">{r.comentario}</p>}</li>)}</ul>
            : <p className="text-sm text-gray-600">Aún no hay opiniones publicadas de productores.</p>}
        </section>
      </div>
      <section aria-labelledby="reputacion" className={`${tarjeta} min-w-0 lg:sticky lg:top-24`}>
        <h2 id="reputacion" className="mb-6 text-2xl font-normal text-petroleo">Reputación como comprador</h2>
        <ResumenReputacion reputacion={reputacion} nombre={comprador.nombre} />
        <p className="mt-6 text-xs leading-relaxed text-gray-500">Calificaciones que le dieron los productores después de cada pedido recibido: puntualidad en el pago, claridad y coordinación. Se publican cuando ambas partes califican.</p>
      </section>
    </div>
  </AppShell>
}
