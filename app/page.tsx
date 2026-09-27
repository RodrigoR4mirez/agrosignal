import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SitePie } from '@/components/SitePie'
import { getProfile } from '@/lib/supabase/auth'
import { ROLE_HOME } from '@/lib/supabase/types'
import { MenuLanding } from '@/components/landing/MenuLanding'
import { AnimacionesScroll } from '@/components/landing/AnimacionesScroll'
import {
  CurvasNivel, IconoApreton, IconoBrote, IconoCaja, IconoCertificado, IconoCubiertos, IconoDron, IconoEstrellas,
  IconoFabrica, IconoFinanciamiento, IconoGarantia, IconoGlobo, IconoMercado, IconoPlan,
} from '@/components/landing/Iconos'

export const metadata: Metadata = {
  title: 'AgroSignal — Cosechas del Perú con confianza verificada',
  description: 'Marketplace agrícola del Perú: lotes con Verificación AgroSignal en tres niveles (certificado, inspección con dron y test de residuos; acepta la certificación BPA del SENASA), calificaciones de ambos lados y, muy pronto, pago en garantía y financiamiento.',
}

// Estructura inspirada en tourba.ma: foto a sangre con menú transparente, textos
// grandes de peso ligero y curvas de nivel como textura. Colores y animaciones de
// scroll adaptados de producepay.com: petróleo, naranja, trigo y crema junto a la tierra.
const caja = 'app-container px-6 sm:px-10 lg:px-32 xl:px-48'
const pildora = 'inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-naranja px-10 text-[17px] font-semibold text-petroleo transition-colors hover:bg-[#f29a5e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-naranja'
const titulo = 'font-sans font-normal tracking-tight text-petroleo'
// Línea trigo bajo los títulos: crece al entrar en pantalla.
const Linea = ({ centro = false }: { centro?: boolean }) => <span data-revelar="linea" aria-hidden="true" className={`mt-7 block h-[3px] w-24 rounded-full bg-trigo ${centro ? 'mx-auto' : ''}`} />

export default async function Landing() {
  const profile = await getProfile()
  const panel = profile ? (profile.suspendido ? '/cuenta-suspendida' : ROLE_HOME[profile.rol]) : null
  const vender = !profile ? '/registro?rol=productor' : profile.rol === 'productor' ? '/panel-productor/publicar' : '/marketplace'
  return <div className="overflow-x-clip bg-white font-sans text-[#2b2118]">
    <AnimacionesScroll />
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Saltar al contenido</a>

    {/* Menú fijo fuera del hero: el hero usa isolate y encerraría su z-index */}
    <MenuLanding panel={panel} />

    {/* Hero: foto a sangre, menú transparente encima */}
    <header className="relative isolate flex min-h-[640px] flex-col text-white lg:h-[860px]">
      <Image src="/landing/hero-pastora-andes.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[80%_68%] lg:object-[50%_72%]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-petroleo/80 via-petroleo/35 to-black/10" />
      <div aria-hidden="true" className="h-24 shrink-0 lg:h-32" />
      <div className={`${caja} flex flex-1 flex-col justify-center pb-20 pt-6`}>
        <h1 className="max-w-4xl font-sans text-5xl font-normal leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[72px]">Cosechas del Perú <br className="hidden sm:block" />con confianza verificada.</h1>
        <div className="mt-12 max-w-[46rem] space-y-1 text-[17px] leading-relaxed text-white/95 sm:text-lg">
          <p>AgroSignal conecta a quienes cultivan con quienes compran, sin intermediarios y con cada lote respaldado por pruebas del campo.</p>
          <p>Certificados revisados, inspecciones con dron y tests de residuos convierten cada oferta en una decisión informada.</p>
          <p>Así se construye un mercado agrícola donde la calidad se demuestra y la confianza se gana.</p>
        </div>
        <div className="mt-12"><Link href="/marketplace" className={pildora}>Explora los productos</Link></div>
      </div>
    </header>

    <main id="contenido">
      {/* Qué es AgroSignal */}
      <section id="que-es" className="relative overflow-hidden scroll-mt-24 bg-crema">
        <CurvasNivel className="absolute -right-24 top-40 w-[34rem] opacity-80 lg:right-[12%]" />
        <div className={`${caja} relative py-24 lg:py-32`}>
          <p data-revelar="subir" className="max-w-[56rem] text-[26px] leading-[1.35] text-tierra sm:text-[34px]">Con una <span className="text-petroleo">verificación en tres niveles</span> para cada lote y la <span className="text-petroleo">reputación</span> de ambas partes, AgroSignal enfrenta el mayor problema del comercio agrícola: comprar sin saber qué llega ni a quién se le paga.</p>
          <div data-revelar="subir">
          <p className="mt-12 max-w-[46rem] text-lg leading-relaxed">Trabajamos con productores de costa, sierra y selva para que publiquen sus lotes con fotos, cantidades y precios reales, y para que cada verificación que suman quede a la vista del comprador.</p>
          <p className="mt-8 max-w-[46rem] text-lg font-semibold leading-relaxed">Nuestra meta es que cualquier comprador del Perú o del mundo pueda elegir una cosecha peruana con la misma seguridad con la que la elegiría en persona. Ese es nuestro compromiso con el campo.</p>
          <div className="mt-14"><a href="#como-funciona" className={pildora}>Descubre cómo</a></div>
          </div>
        </div>
      </section>

      {/* Verificación AgroSignal (propia) y su relación con el Sello BPA oficial del SENASA */}
      <section id="verificacion" className="scroll-mt-24">
        <div className={`${caja} grid items-center gap-16 pt-24 lg:grid-cols-[1.2fr_1fr] lg:pt-32`}>
          <div data-revelar="izquierda">
            <h2 className={`${titulo} text-4xl sm:text-[46px]`}>Verificación AgroSignal</h2>
            <Linea />
            <p className="mt-9 max-w-[46rem] text-lg leading-relaxed">Porque una foto no basta. Cada lote puede sumar hasta tres controles que revisa el equipo de AgroSignal. En el catálogo ves el nivel más alto que alcanzó.</p>
            <ol className="mt-8 max-w-[46rem] space-y-5">
              {[
                ['Nivel 1 · Documento', 'Un certificado vigente (del SENASA, GlobalG.A.P. u otro) revisado por nuestro equipo.'],
                ['Nivel 2 · Inspección con dron', 'Un vuelo sobre el campo con fotos, coordenadas y fecha como evidencia del cultivo real.'],
                ['Nivel 3 · Test de residuos', 'Tiras reactivas sobre la cosecha. Si no pasa, el lote sale del catálogo al instante.'],
              ].map(([nivel, texto], i) => <li key={nivel} className="flex gap-4">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-naranja text-sm font-semibold text-petroleo">{i + 1}</span>
                <p className="text-[17px] leading-relaxed"><strong className="font-semibold text-petroleo">{nivel}.</strong> {texto}</p>
              </li>)}
            </ol>
            <p className="mt-10 text-xl font-semibold text-gray-700">Nuestra misión es clara:</p>
            <p className="mt-5 max-w-xl text-2xl italic leading-[1.55] text-petroleo sm:text-[28px]">Que la calidad del campo peruano se pueda demostrar, y que quien la cultiva reciba lo justo por ella.</p>
            <div className="mt-10"><Link href="/marketplace" className={pildora}>Ver el catálogo</Link></div>
          </div>
          <div data-revelar="derecha" className="relative mx-auto aspect-square w-full max-w-[26rem]">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <Image src="/landing/sello-dron.jpg" alt="Dron sobrevolando un campo de cultivo" fill sizes="(max-width: 1024px) 80vw, 26rem" className="object-cover object-[50%_30%] grayscale" />
              <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0" fill="none" stroke="white" strokeWidth="3.2">
                <path d="M4 72 Q50 50 96 72" /><path d="M10 82 Q50 62 90 82" /><path d="M18 91 Q50 74 82 91" />
              </svg>
            </div>
            <span aria-hidden="true" className="absolute -right-2 -top-4 grid size-20 place-items-center rounded-full bg-naranja"><span className="size-6 rounded-full bg-crema" /></span>
          </div>
        </div>

        <div className={`${caja} pb-24 pt-14 lg:pb-32`}>
          <p data-revelar="subir" className="flex max-w-[56rem] flex-wrap items-baseline gap-x-3 gap-y-2 border-l-[3px] border-trigo py-1 pl-5 text-[17px] leading-relaxed text-gray-700">
            <span><strong className="font-semibold text-petroleo">¿Y el Sello BPA del SENASA?</strong> Es un distintivo oficial distinto a esta verificación. Si tu predio lo tiene, cuenta como nivel 1.</span>
            <Link href="/ayuda#bpa" className="font-semibold text-petroleo underline underline-offset-4 hover:text-tierra">Conoce la diferencia</Link>
          </p>
        </div>
      </section>

      {/* Banda tierra: productores y compradores */}
      <section aria-labelledby="para-quien" className="relative">
        <div className="bg-tierra shadow-[0_-40px_60px_-30px_rgba(0,0,0,0.12)]">
          <div className={`${caja} pb-72 pt-20 sm:pb-80 lg:pb-96`}>
            <h2 id="para-quien" className="sr-only">Para productores y compradores</h2>
            <div className="grid gap-2 md:grid-cols-2">
              <article data-revelar="izquierda" className="rounded-[20px] bg-crema p-10 md:p-12">
                <h3 className="font-sans text-[28px] font-normal text-musgo">Para productores</h3>
                <p className="mt-6 text-[15px] leading-relaxed text-gray-700">Si cultivas frutas, café, cacao, granos andinos o tubérculos, AgroSignal es tu vitrina. Publica tus lotes con fotos, cantidades y precio, y recibe pedidos directos de compradores de todo el país.</p>
                <p className="text-[15px] leading-relaxed text-gray-700">Suma certificados, inspección con dron y test de residuos para subir el nivel de tu Verificación AgroSignal y destacar frente a quienes compran para exportar.</p>
              </article>
              <div data-revelar="derecha" className="relative min-h-64 overflow-hidden rounded-[20px]"><Image src="/landing/productora-cafe.jpg" alt="Productora de café junto a sus plantones" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" /></div>
              <div data-revelar="izquierda" className="relative min-h-64 overflow-hidden rounded-[20px] max-md:order-last"><Image src="/landing/compradores-mercado.jpg" alt="Cajas de verduras frescas a la venta en un mercado" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" /></div>
              <article data-revelar="derecha" className="rounded-[20px] bg-arena-claro p-10 md:p-12">
                <h3 className="font-sans text-[28px] font-normal text-musgo">Para compradores</h3>
                <p className="mt-6 text-[15px] leading-relaxed text-gray-700">Exportadores, agroindustrias, restaurantes y compradores particulares encuentran aquí lotes con origen, cantidad y verificaciones a la vista.</p>
                <p className="text-[15px] leading-relaxed text-gray-700">Filtra por cultivo, región, precio, nivel de verificación y calificación del productor, y haz tu pedido en minutos.</p>
              </article>
            </div>
            <p className="mx-auto mt-14 max-w-3xl text-center text-2xl leading-snug text-white sm:text-[28px]">¿Produces o compras cosechas y quieres hacerlo con más confianza?<br />AgroSignal es tu puerta de entrada al campo peruano.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-6">
              <Link href={vender} className={pildora}>Publicar mi cosecha</Link>
              <Link href="/marketplace" className={pildora}>Ver productos</Link>
            </div>
          </div>
        </div>
        <div className={`${caja} relative -mt-60 sm:-mt-64 lg:-mt-80`}>
          <Link data-revelar="subir" href="/marketplace" className="group relative block aspect-video overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
            <Image src="/landing/catalogo-puesto-verduras.jpg" alt="" fill sizes="(max-width: 1024px) 100vw, 66rem" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            <span className="absolute inset-0 bg-black/25" />
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center text-white">
              <span className="text-3xl font-light sm:text-5xl">Recorre el catálogo</span>
              <span className="rounded-full bg-naranja px-8 py-3 text-base font-semibold text-petroleo">Ver productos publicados</span>
            </span>
          </Link>
        </div>
      </section>

      {/* Tipos de productos */}
      <section className="relative overflow-hidden">
        <CurvasNivel className="absolute -right-40 -top-10 w-[36rem] opacity-90 lg:right-[4%]" />
        <div className={`${caja} relative grid gap-12 py-24 lg:grid-cols-2 lg:gap-24`}>
          <p data-revelar="izquierda" className="text-[28px] leading-[1.4] text-tierra sm:text-[36px]">Palta, café, cacao, arándano, mango, papa nativa, quinua y mucho más, publicados por quienes los cultivan.</p>
          <div data-revelar="derecha">
            <p className="text-lg leading-relaxed">Frutas de exportación de la costa, granos andinos y tubérculos de la sierra, café y cacao de la selva. Cada lote indica su región, su destino (mercado local o exportación), el estado de la cosecha y el stock disponible, con precio por kilo o por tonelada.</p>
            <div className="mt-12"><Link href="/marketplace" className={pildora}>Ver todos los productos</Link></div>
          </div>
        </div>
      </section>

      {/* Lo que ofrece AgroSignal */}
      <section id="ofrecemos" aria-labelledby="ofrecemos-titulo" className="scroll-mt-24">
        <div className={`${caja} pb-32`}>
          <h2 id="ofrecemos-titulo" className={`${titulo} text-4xl sm:text-[46px]`}>Lo que ofrece AgroSignal</h2>
          <Linea />
          <ul data-revelar="subir" className="mt-20 grid gap-x-16 gap-y-24 md:grid-cols-2 lg:grid-cols-3">
            {[
              [IconoMercado, 'Marketplace directo', 'Publica o encuentra lotes de todo el Perú sin intermediarios. El precio acordado queda registrado en cada pedido.', null],
              [IconoCertificado, 'Certificados verificados', 'Sube tu certificado del SENASA (incluida la certificación BPA), GlobalG.A.P. u otro. Nuestro equipo lo revisa y cuenta mientras esté vigente.', null],
              [IconoDron, 'Inspección con dron', 'Un vuelo sobre el campo deja fotos o video, coordenadas y fecha como evidencia del cultivo real.', null],
              [IconoEstrellas, 'Calificaciones de doble ciego', 'Comprador y productor se califican al recibir el pedido. Nadie ve la opinión del otro hasta que ambos califican.', null],
              [IconoGarantia, 'Pago en garantía (escrow)', 'El dinero del comprador queda en custodia y solo se libera al productor cuando ambas partes confirman que se cumplió el acuerdo.', 'Próximamente'],
              [IconoFinanciamiento, 'Financiamiento para tu campaña', 'Financiamiento colectivo (crowdfunding agrícola): personas y empresas podrán financiar la siembra de un productor a cambio de un retorno o de la cosecha.', 'Próximamente'],
            ].map(([Icono, nombre, texto, estado]) => {
              const I = Icono as typeof IconoMercado
              return <li key={nombre as string} className="relative rounded-[14px] bg-crema px-8 pb-12 pt-24">
                <I className="absolute left-1/2 top-0 size-24 -translate-x-1/2 -translate-y-[62%] text-musgo" />
                {estado && <span className="absolute right-5 top-5 rounded-full bg-trigo px-3 py-1 text-xs font-semibold text-petroleo">{estado as string}</span>}
                <h3 className="font-sans text-[26px] font-normal leading-tight text-petroleo">{nombre as string}</h3>
                <p className="mt-5 text-[15px] leading-relaxed text-gray-700">{texto as string}</p>
              </li>
            })}
          </ul>
        </div>
      </section>

      {/* Banda verde: acuerdos protegidos */}
      <section aria-labelledby="garantia" className="relative mt-16 bg-petroleo text-white">
        <div className={`${caja} grid items-center gap-12 py-24 lg:grid-cols-[1.4fr_1fr]`}>
          <div data-revelar="izquierda">
            <p className="mb-5 inline-flex rounded-full bg-trigo px-4 py-1.5 text-sm font-semibold text-petroleo">Próximamente</p>
            <h2 id="garantia" className="font-sans text-4xl font-normal leading-tight text-white sm:text-[46px]">Acuerdos protegidos con pago en garantía</h2>
            <Linea />
            <p className="mt-9 max-w-[42rem] text-lg leading-relaxed text-white/90">Estamos preparando el pago en garantía: el comprador deposita, AgroSignal custodia el dinero y el productor lo recibe cuando ambos confirman la entrega. Hoy los pagos se coordinan directamente entre las partes. Crea tu cuenta y te avisaremos cuando esté disponible.</p>
            <div className="mt-12"><Link href={profile ? '/marketplace' : '/registro'} className={pildora}>{profile ? 'Ver productos' : 'Crear mi cuenta'}</Link></div>
          </div>
          <div data-revelar="derecha" className="relative mx-auto aspect-square w-full max-w-[25rem] overflow-hidden rounded-full shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)] lg:-my-40">
            <Image src="/landing/pago-productor.jpg" alt="Una compradora paga en efectivo a un productor por una bolsa de verduras frescas" fill sizes="(max-width: 1024px) 80vw, 25rem" className="object-cover object-[44%_50%]" />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="relative scroll-mt-24 overflow-hidden">
        <CurvasNivel className="absolute left-1/2 top-24 w-[72rem] max-w-none -translate-x-1/2 opacity-60" />
        <div className={`${caja} relative py-28`}>
          <h2 id="como-funciona-titulo" className={`${titulo} text-4xl sm:text-[46px]`}>Cómo funciona</h2>
          <Linea />
          <ol data-revelar="subir" className="mt-20 grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              [IconoPlan, 'Publica', 'El productor sube su lote con fotos, cantidad, precio y destino. Aparece en el catálogo apenas lo publica.', 'bg-petroleo'],
              [IconoCertificado, 'Verifica', 'Suma certificado, inspección con dron y test de residuos para elevar el nivel de su Verificación AgroSignal.', 'bg-petroleo/85'],
              [IconoApreton, 'Acuerda', 'El comprador hace su pedido. Cuando el productor lo acepta, la cantidad se descuenta del stock y coordinan la entrega.', 'bg-tierra'],
              [IconoBrote, 'Recibe y califica', 'Al recibir la cosecha, ambos se califican. Esa reputación ayuda al siguiente comprador y al siguiente productor.', 'bg-naranja'],
            ].map(([Icono, nombre, texto, tono], i, lista) => {
              const I = Icono as typeof IconoPlan
              return <li key={nombre as string} className="relative flex flex-col items-center text-center">
                <span className={`grid size-40 place-items-center rounded-full ${tono as string}`}><I className="size-20 text-white" /></span>
                {i < lista.length - 1 && <span aria-hidden="true" className="absolute left-[calc(50%+6.5rem)] top-20 hidden h-[3px] w-14 rounded-full bg-trigo lg:block" />}
                <h3 className="mt-8 font-sans text-2xl font-normal text-petroleo">{nombre as string}</h3>
                <p className="mt-5 max-w-60 text-[15px] leading-snug text-gray-700">{texto as string}</p>
              </li>
            })}
          </ol>

          <h2 className="mt-32 text-center font-sans text-4xl font-normal text-tierra">Para quién es AgroSignal</h2>
          <Linea centro />
          <ul data-revelar="subir" className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-3">
            {[[IconoGlobo, 'Exportadores'], [IconoFabrica, 'Empresas y agroindustria'], [IconoCubiertos, 'Restaurantes y compradores particulares']].map(([Icono, nombre]) => {
              const I = Icono as typeof IconoGlobo
              return <li key={nombre as string} className="flex flex-col items-center gap-4 text-center"><I className="size-16 text-tierra" /><span className="text-lg font-semibold text-gray-800">{nombre as string}</span></li>
            })}
          </ul>
          <p className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-3 text-center text-gray-600"><IconoCaja className="size-7 shrink-0 text-musgo" />Y productores de todo tamaño, desde la chacra familiar hasta el fundo agroexportador.</p>
        </div>
      </section>

      {/* Tarjetas finales sobre franja partida blanco / tierra */}
      <section className="bg-linear-to-b from-white from-[22%] to-petroleo to-[22%]">
        <div className={`${caja} grid gap-2 pt-8 md:grid-cols-2`}>
          {[
            ['/landing/puesto-verduras.jpg', 'Encuentra la cosecha que buscas entre los lotes publicados', '/marketplace', 'Ver productos'],
            ['/landing/agricultor-campo.jpg', 'Preguntas frecuentes', '/ayuda', 'Consultar ayuda'],
          ].map(([foto, texto, href, accion], i) => <div key={href} data-revelar={i ? 'derecha' : 'izquierda'} className="relative isolate flex min-h-80 flex-col items-center justify-center gap-10 overflow-hidden rounded-[20px] px-10 py-14 text-center">
            <Image src={foto} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" className="-z-10 object-cover object-[50%_25%]" />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-black/45" />
            <p className="max-w-sm text-[28px] leading-tight text-white">{texto}</p>
            <Link href={href} className="inline-flex min-h-11 items-center gap-3 rounded-full bg-naranja px-7 text-[17px] font-semibold text-petroleo hover:bg-[#f29a5e]">{accion}</Link>
          </div>)}
        </div>
      </section>
    </main>

    <SitePie panel={panel} invitacion contenedor={caja} />
  </div>
}
