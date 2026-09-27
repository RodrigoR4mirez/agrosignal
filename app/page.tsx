import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { SelloInocuidadBadge } from '@/components/SelloInocuidadBadge'
import { LotCard } from '@/components/marketplace/LotCard'
import { SelloAndenes } from '@/components/landing/SelloAndenes'
import { Estrellas, IconoCandado, ReputacionCompacta, ResumenReputacion } from '@/components/calificaciones/Reputacion'
import { getFeaturedLots } from '@/lib/marketplace/data'
import { esEjemplo, money, photoUrl, type LotePublico } from '@/lib/marketplace/types'
import { getProfile } from '@/lib/supabase/auth'

export const metadata: Metadata = {
  title: 'AgroSignal — Compra la cosecha a quien la siembra',
  description: 'Lotes de productores de todo el Perú con Sello de Inocuidad en tres niveles y calificaciones de ambos lados del trato.',
}

const CULTIVOS = ['Palta', 'Café', 'Cacao', 'Arándano', 'Mango', 'Papa']
const contenedor = 'app-container px-4 sm:px-6 lg:px-8'

export default async function Landing() {
  const [profile, destacados] = await Promise.all([getProfile(), getFeaturedLots(5)])
  const [portada, ...resto] = destacados.lots
  const venderHref = !profile ? '/registro?rol=productor' : profile.rol === 'productor' ? '/panel-productor/publicar' : null
  return <AppShell profile={profile} ancho="completo">
    {/* Hero: la promesa, un buscador y un lote real sobre la foto de andenes */}
    <section className="leaf-texture overflow-hidden text-arena-claro">
      <div className={`${contenedor} grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-24`}>
        <div>
          <h1 className="max-w-3xl text-5xl font-medium leading-[1.02] text-white sm:text-6xl lg:text-7xl">Compra la cosecha a quien la siembra.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-arena-claro/85">Lotes de productores de todo el Perú, con un Sello de Inocuidad que se verifica en el campo y calificaciones de los dos lados del trato.</p>
          <form action="/marketplace" role="search" className="mt-9 flex max-w-xl flex-wrap gap-2 rounded-[22px] bg-white/10 p-2 ring-1 ring-white/15 backdrop-blur sm:flex-nowrap">
            <label htmlFor="buscar-hero" className="sr-only">Busca un cultivo</label>
            <input id="buscar-hero" name="q" type="search" maxLength={100} placeholder="Busca palta, café, cacao…" className="min-h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 text-base text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-arena" />
            <button className="min-h-12 w-full rounded-2xl bg-arena px-6 text-sm font-bold text-cacao hover:bg-arena-claro sm:w-auto">Buscar</button>
          </form>
          <nav aria-label="Cultivos frecuentes" className="mt-5 flex flex-wrap gap-2">
            {CULTIVOS.map(c => <Link key={c} href={`/marketplace?q=${encodeURIComponent(c.toLowerCase())}`} className="rounded-full border border-arena/30 px-3.5 py-1.5 text-sm text-arena-claro/90 hover:border-arena hover:bg-white/10">{c}</Link>)}
          </nav>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold">
            <Link href="/marketplace" className="text-white underline decoration-arena/60 underline-offset-[6px] hover:decoration-white">Ver todos los productos</Link>
            {venderHref && <Link href={venderHref} className="text-arena-claro/85 hover:text-white">Vender mi cosecha</Link>}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-4/5 overflow-hidden rounded-t-[999px] rounded-b-[28px] ring-1 ring-white/15">
            <Image src="/marketplace/hero-valle-sagrado-terrazas.jpg" alt="Andenes agrícolas en un valle de los Andes" fill priority sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bosque/60 via-transparent to-transparent" />
          </div>
          {portada && <LoteFlotante lot={portada} />}
        </div>
      </div>
    </section>

    {/* Sello de Inocuidad: el elemento memorable de la página */}
    <section aria-label="Sello de Inocuidad" className={`${contenedor} py-20 lg:py-28`}>
      <SelloAndenes />
    </section>

    {/* Reputación de doble ciego */}
    <section aria-labelledby="confianza" className="border-y border-[#dfe3d4] bg-arena-claro/60">
      <div className={`${contenedor} grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-20`}>
        <div>
          <h2 id="confianza" className="text-3xl font-medium leading-tight text-bosque sm:text-4xl">Confianza de los dos lados del trato</h2>
          <p className="mt-4 max-w-prose leading-relaxed text-gray-700">Cuando el pedido llega, comprador y productor se califican. Así quien vende también sabe con quién trata.</p>
          <dl className="mt-8 space-y-6">
            {[
              ['Sin influencias', 'Ninguno ve la opinión del otro hasta que ambos califican, o hasta que pasan 14 días.'],
              ['Un promedio que se gana', 'Mostramos el promedio desde la tercera calificación. Antes, el perfil dice “Nuevo en la plataforma”.'],
              ['Opiniones que no se editan', 'Una por persona y por pedido. Lo que se envía, queda.'],
            ].map(([titulo, texto]) => <div key={titulo} className="border-l-2 border-musgo pl-5"><dt className="font-semibold text-gray-900">{titulo}</dt><dd className="mt-1 max-w-prose text-sm leading-relaxed text-gray-600">{texto}</dd></div>)}
          </dl>
        </div>
        <figure className="relative">
          <div className="card-surface bg-white p-6 sm:p-8"><ResumenReputacion reputacion={{ total: 48, promedio: 4.7, distribucion: { '5': 37, '4': 8, '3': 2, '2': 1, '1': 0 } }} nombre="" /></div>
          <div className="card-surface sellada relative -mt-6 ml-6 bg-white sm:ml-16">
            <div className="sellada-contenido flex gap-4 p-6" aria-hidden="true"><span className="size-11 shrink-0 rounded-full bg-arena" /><div className="flex-1 space-y-2"><Estrellas valor={4} tamano={14} /><p className="text-sm">Buena fruta, llegó a tiempo y bien empacada.</p></div></div>
            <div className="sellada-vidrio flex items-center gap-3 px-6"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-bosque text-arena-claro"><IconoCandado className="size-5" /></span><p className="text-sm font-semibold text-cacao">Sellada hasta que ambos califiquen</p></div>
          </div>
          <figcaption className="mt-4 text-xs text-gray-500">Ilustración con datos de ejemplo.</figcaption>
        </figure>
      </div>
    </section>

    {/* Cosechas destacadas reales del catálogo */}
    {resto.length > 0 && <section aria-labelledby="destacadas" className={`${contenedor} py-20`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h2 id="destacadas" className="text-3xl font-medium text-bosque sm:text-4xl">Cosechas que puedes pedir hoy</h2>
        <Link href="/marketplace" className="inline-flex min-h-11 items-center rounded-full bg-bosque px-6 text-sm font-bold text-white hover:bg-bosque-claro">Ver todos los productos</Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{resto.slice(0, 4).map(lot => <LotCard key={lot.id} lot={lot} />)}</div>
    </section>}

    {/* Cómo funciona, por tipo de cuenta: son pasos en orden */}
    <section aria-labelledby="como-funciona" className="bg-white/60">
      <div className={`${contenedor} py-20`}>
        <h2 id="como-funciona" className="mb-12 text-3xl font-medium text-bosque sm:text-4xl">Cómo funciona</h2>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Pasos titulo="Si compras" pasos={[
            ['Busca y compara', 'Filtra por cultivo, región, precio, nivel de Sello y calificación del productor.'],
            ['Haz tu pedido', 'Indica cantidad y dirección. Cuando el productor lo acepta, esa cantidad se descuenta de su stock.'],
            ['Recibe y califica', 'Confirma la entrega y cuenta cómo te fue. El pago lo coordinan entre ustedes.'],
          ]} />
          <Pasos titulo="Si produces" pasos={[
            ['Publica tu lote', 'Fotos, cantidad, precio y destino. Aparece en el catálogo apenas lo publicas.'],
            ['Suma verificaciones', 'Certificado, dron y test de residuos elevan el nivel de tu Sello.'],
            ['Vende y gana reputación', 'Acepta pedidos, coordina la entrega y construye tu calificación.'],
          ]} />
        </div>
      </div>
    </section>

    <section className="leaf-texture text-arena-claro">
      <div className={`${contenedor} flex flex-wrap items-center justify-between gap-8 py-16`}>
        <h2 className="max-w-2xl text-3xl font-medium leading-tight text-white sm:text-4xl">Hay cosechas esperando quien las lleve a su mesa.</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/marketplace" className="inline-flex min-h-12 items-center rounded-full bg-arena px-7 text-sm font-bold text-cacao hover:bg-arena-claro">Explorar productos</Link>
          {venderHref && <Link href={venderHref} className="inline-flex min-h-12 items-center rounded-full border border-arena/40 px-6 text-sm font-semibold hover:bg-white/10">Vender mi cosecha</Link>}
        </div>
      </div>
    </section>
  </AppShell>
}

function LoteFlotante({ lot }: { lot: LotePublico }) {
  const foto = photoUrl(lot.fotos[0] ?? '')
  return <Link href={`/marketplace/${lot.id}`} className="card-surface card-surface-hover absolute -bottom-6 left-1/2 flex w-[min(92%,22rem)] -translate-x-1/2 gap-4 bg-white p-3.5 text-gray-900 sm:-left-8 sm:translate-x-0 lg:-left-14">
    <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-arena-claro">{foto && <Image src={foto} alt="" fill unoptimized sizes="80px" className="object-cover" />}</span>
    <span className="min-w-0 flex-1 space-y-1.5">
      <span className="flex items-baseline justify-between gap-2"><span className="truncate font-display text-lg text-bosque">{lot.cultivo}</span>{esEjemplo(lot) && <span className="shrink-0 rounded-full bg-arena px-2 py-0.5 text-[11px] font-bold text-cacao">Ejemplo</span>}</span>
      <span className="block text-xs text-gray-600">{lot.region} · <strong className="text-cacao">{money(lot.precio_unidad)}</strong>/{lot.unidad}</span>
      <span className="flex flex-wrap items-center gap-2"><SelloInocuidadBadge nivel={lot.nivel_sello} /><ReputacionCompacta promedio={lot.productor_promedio} total={lot.productor_calificaciones} /></span>
    </span>
  </Link>
}

function Pasos({ titulo, pasos }: { titulo: string; pasos: string[][] }) {
  return <div>
    <h3 className="mb-6 text-2xl font-medium text-tierra">{titulo}</h3>
    <ol className="space-y-7">
      {pasos.map(([nombre, texto], i) => <li key={nombre} className="flex gap-5">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-bosque font-display text-lg text-arena-claro">{i + 1}</span>
        <div><p className="font-semibold text-gray-900">{nombre}</p><p className="mt-1 max-w-prose text-sm leading-relaxed text-gray-600">{texto}</p></div>
      </li>)}
    </ol>
  </div>
}
