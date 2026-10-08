import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { GraficoPrecios } from '@/components/comunidad/GraficoPrecios'
import { CurvasNivel } from '@/components/landing/Iconos'
import { getCultivosConPrecios, getHistorialPrecios } from '@/lib/comunidad/data'
import { getProfile } from '@/lib/supabase/auth'
import { Metrica } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Precios por cultivo | AgroSignal', description: 'Evolución mensual del precio publicado y de venta de cada cultivo en AgroSignal, por kilo.' }
const caja = 'app-container px-4 sm:px-6 lg:px-8'
const soles = (v: number) => `S/\u00a0${v.toFixed(2)}`
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']

export default async function PreciosPage({ searchParams }: { searchParams: Promise<{ cultivo?: string }> }) {
  const { cultivo } = await searchParams
  const [profile, { cultivos, error }] = await Promise.all([getProfile(), getCultivosConPrecios()])
  const elegido = cultivos.find(c => c.cultivo_base === cultivo?.toLowerCase()) ?? cultivos[0]
  const { serie } = elegido ? await getHistorialPrecios(elegido.cultivo_base, 12) : { serie: [] }
  const publicados = serie.filter(p => p.publicado !== null)
  const ultimo = publicados.at(-1), anterior = publicados.at(-4) ?? publicados[0]
  const variacion = ultimo && anterior && anterior !== ultimo ? Math.round(((ultimo.publicado! - anterior.publicado!) / anterior.publicado!) * 100) : null
  const ventas = serie.reduce((s, p) => s + p.ventas, 0)
  const ejemplo = serie.some(p => p.ejemplo)
  const cifras: [string, string][] = ultimo ? [
    ['Último precio publicado', `${soles(ultimo.publicado!)} /kg`],
    ['Variación en 3 meses', variacion === null ? '—' : `${variacion > 0 ? '+' : ''}${variacion} %`],
    ['Rango del año', `${soles(Math.min(...serie.map(p => p.minimo)))} – ${soles(Math.max(...serie.map(p => p.maximo)))}`],
    ['Ventas registradas', String(ventas)],
  ] : []

  return <AppShell profile={profile} anchoCompleto>
    <section className="relative overflow-hidden bg-petroleo text-white">
      <CurvasNivel className="absolute -right-32 -top-24 w-[38rem] opacity-40" />
      <div className={`${caja} relative py-12 lg:py-14`}>
        <nav aria-label="Ruta" className="mb-4 text-sm text-white/70"><Link href="/marketplace" className="font-semibold text-white underline-offset-4 hover:underline">Productos</Link> / Precios</nav>
        <h1 className="text-4xl font-normal leading-tight text-white sm:text-5xl">Precios por cultivo</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-white/80">Cómo se movió el precio por kilo en AgroSignal mes a mes: lo que piden los productores al publicar y lo que se pagó en ventas concretadas.</p>
        {cultivos.length > 0 && <nav aria-label="Cultivos" className="-mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {cultivos.map(c => { const activo = c.cultivo_base === elegido?.cultivo_base; return <Link key={c.cultivo_base} href={`/marketplace/precios?cultivo=${c.cultivo_base}`} aria-current={activo ? 'true' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${activo ? 'bg-naranja font-semibold text-petroleo' : 'bg-white/12 text-white ring-1 ring-white/30 hover:bg-white/20'}`}>{c.nombre}</Link> })}
        </nav>}
      </div>
    </section>
    <div className="bg-crema">
      <div className={`${caja} py-10 lg:py-12`}>
        {error ? <p role="alert" className="rounded-[22px] bg-white p-8 text-sm text-red-800">No pudimos cargar los precios. Intenta nuevamente en unos momentos.</p>
          : !elegido || !serie.length ? <p className="rounded-[22px] bg-white p-8 text-sm text-gray-600">Aún no hay suficientes publicaciones para mostrar precios.</p>
          : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            <section aria-labelledby="grafico" className="min-w-0 rounded-[22px] border border-linea bg-white p-5 sm:p-8">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><h2 id="grafico" className="text-2xl font-normal text-petroleo">{elegido.nombre}: precio por kilo</h2><Link href={`/marketplace?q=${encodeURIComponent(elegido.nombre)}`} className="text-sm font-semibold text-petroleo underline underline-offset-4">Ver lotes de {elegido.nombre.toLowerCase()}</Link></div>
              <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"><div className="min-w-[36rem] sm:min-w-0"><GraficoPrecios serie={serie} titulo={`Precio mensual de ${elegido.nombre.toLowerCase()} por kilo`} /></div></div>
            </section>
            <aside aria-label="Resumen" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">{cifras.map(([k, v]) => <Metrica key={k} etiqueta={k} valor={v} compacta className="p-4 sm:p-5" />)}</div>
              <p className="text-xs leading-relaxed text-gray-500">Precios en soles por kilo (las toneladas se convierten a kilos). El publicado es el promedio de los lotes publicados o con precio cambiado ese mes; el de venta, el de los pedidos recibidos. {ejemplo && 'Incluye datos de ejemplo de la demostración.'}</p>
            </aside>
            <section aria-labelledby="tabla" className="min-w-0 overflow-x-auto rounded-[22px] border border-linea bg-white p-5 sm:p-8 lg:col-span-2">
              <h2 id="tabla" className="mb-4 text-xl font-normal text-petroleo">Mes a mes</h2>
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead><tr className="border-b border-linea text-xs text-gray-500"><th className="py-2 font-semibold">Mes</th><th className="py-2 font-semibold">Publicado</th><th className="py-2 font-semibold">Vendido</th><th className="py-2 font-semibold">Mín. – máx.</th><th className="py-2 font-semibold">Registros</th></tr></thead>
                <tbody>{[...serie].reverse().map(p => { const [a, m] = p.mes.split('-').map(Number); return <tr key={p.mes} className="border-b border-linea-suave tabular-nums">
                  <td className="py-2.5 capitalize">{MES[m - 1]} {a}</td><td className="py-2.5 font-semibold text-petroleo">{p.publicado !== null ? soles(p.publicado) : '—'}</td><td className="py-2.5">{p.vendido !== null ? soles(p.vendido) : '—'}</td>
                  <td className="py-2.5 text-gray-600">{soles(p.minimo)} – {soles(p.maximo)}</td><td className="py-2.5 text-gray-600">{p.publicaciones} publ. · {p.ventas} ventas</td></tr> })}</tbody>
              </table>
            </section>
          </div>}
      </div>
    </div>
  </AppShell>
}
