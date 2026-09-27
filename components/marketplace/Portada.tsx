import Image from 'next/image'
import Link from 'next/link'

// Ícono de Material Symbols (fuente enlazada en app/marketplace/layout.tsx).
function Icono({ nombre, className = '' }: { nombre: string; className?: string }) {
  return <span aria-hidden="true" className={`material-symbols-outlined select-none leading-none ${className}`}>{nombre}</span>
}

const PASOS = [
  { icono: 'photo_camera', titulo: 'Publica tu lote', texto: 'Sube fotos, cantidad y precio desde tu panel. Tu cosecha aparece en el catálogo al instante.' },
  { icono: 'verified', titulo: 'Suma verificaciones', texto: 'Certificados, inspección con dron y test de residuos elevan el nivel de tu Sello de Inocuidad.' },
  { icono: 'handshake', titulo: 'Acuerda el pedido', texto: 'El comprador reserva stock y tú aceptas o rechazas cada pedido con un clic.' },
  { icono: 'local_shipping', titulo: 'Entrega y calificación', texto: 'Coordinan la entrega y el comprador califica la compra para el siguiente cliente.' },
]

const CULTIVOS: { nombre: string; q: string; icono: string; texto: string; tono: string }[] = [
  { nombre: 'Palta', q: 'palta', icono: 'eco', texto: 'Hass y Fuerte de La Libertad, Ica y Junín.', tono: 'bg-musgo text-white' },
  { nombre: 'Café', q: 'café', icono: 'coffee', texto: 'Arábica de altura de San Martín, Cajamarca y Junín.', tono: 'bg-tierra text-arena-claro' },
  { nombre: 'Cacao', q: 'cacao', icono: 'spa', texto: 'Fino de aroma de la Amazonía peruana.', tono: 'bg-[#8a5a36] text-arena-claro' },
  { nombre: 'Arándano', q: 'arándano', icono: 'grain', texto: 'Campaña de exportación de la costa norte.', tono: 'bg-cacao text-arena-claro' },
  { nombre: 'Papa', q: 'papa', icono: 'agriculture', texto: 'Nativas y comerciales de la sierra central y sur.', tono: 'bg-arena text-cacao' },
]

export function Portada({ publicarHref }: { publicarHref: string | null }) {
  return <div className="mb-12 space-y-8">
    {/* Hero: panel bosque + foto de terrazas andinas con corte diagonal */}
    <section className="relative grid overflow-hidden rounded-[28px] bg-bosque lg:grid-cols-[1.05fr_1fr]">
      <div className="relative z-10 px-7 py-12 sm:px-12 sm:py-16 lg:py-20">
        <h1 className="max-w-xl text-4xl font-medium leading-[1.08] text-arena-claro sm:text-5xl lg:text-6xl">Cosechas peruanas, directo de quien las cultiva</h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-arena-claro/80 sm:text-lg">Compara lotes de productores de todo el país, revisa su origen y su Sello de Inocuidad, y haz tu pedido sin intermediarios.</p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a href="#catalogo" className="inline-flex min-h-12 items-center rounded-full bg-linear-to-b from-[#f3e2c2] to-arena px-7 text-sm font-bold text-cacao shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] hover:from-white">Ver cosechas disponibles</a>
          {publicarHref && <Link href={publicarHref} className="inline-flex min-h-12 items-center rounded-full border border-arena/40 px-6 text-sm font-semibold text-arena-claro hover:bg-white/10">Publicar mi cosecha</Link>}
        </div>
      </div>
      <div className="relative min-h-64 lg:min-h-full">
        <Image src="/marketplace/hero-valle-sagrado-terrazas.jpg" alt="Terrazas agrícolas andinas junto a un valle verde en Cusco" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover lg:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]" />
        <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-[18%] bg-linear-to-br from-tierra to-cacao lg:block lg:[clip-path:polygon(0_0,100%_0,0_100%)]" />
      </div>
    </section>

    {/* Cómo funciona: los cuatro pasos reales del flujo de compra */}
    <section aria-labelledby="como-funciona" className="leaf-texture rounded-[28px] px-7 py-10 text-arena-claro sm:px-12">
      <h2 id="como-funciona" className="mb-8 text-2xl font-medium text-white sm:text-3xl">Así funciona una venta en AgroSignal</h2>
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {PASOS.map(paso => <li key={paso.titulo} className="lg:border-l lg:border-white/10 lg:px-7 lg:first:border-l-0 lg:first:pl-0">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-arena/40"><Icono nombre={paso.icono} className="text-[28px] text-arena" /></span>
          <h3 className="mb-2 text-lg font-medium text-white">{paso.titulo}</h3>
          <p className="text-sm leading-relaxed text-arena-claro/75">{paso.texto}</p>
        </li>)}
      </ol>
    </section>

    {/* Mosaico de cultivos: atajos de búsqueda en tonos tierra */}
    <section aria-labelledby="explora">
      <h2 id="explora" className="mb-5 text-2xl font-medium text-bosque sm:text-3xl">Explora por cultivo</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
        {CULTIVOS.slice(0, 3).map(c => <Mosaico key={c.nombre} {...c} />)}
        <div className="relative min-h-44 overflow-hidden rounded-[22px] shadow-[var(--shadow-card)]">
          <Image src="/pro/hero-agricultor-sembrando.jpg" alt="Agricultor sembrando a mano en un campo arado" fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
        </div>
        {CULTIVOS.slice(3).map(c => <Mosaico key={c.nombre} {...c} />)}
      </div>
    </section>
  </div>
}

function Mosaico({ nombre, q, icono, texto, tono }: (typeof CULTIVOS)[number]) {
  return <Link href={`/marketplace?q=${encodeURIComponent(q)}#catalogo`} className={`group flex min-h-44 flex-col items-center justify-center rounded-[22px] px-5 py-7 text-center shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bosque ${tono}`}>
    <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black/15 ring-1 ring-white/20"><Icono nombre={icono} className="text-[28px]" /></span>
    <span className="font-display text-xl font-medium">{nombre}</span>
    <span className="mt-2 max-w-56 text-xs leading-relaxed opacity-80">{texto}</span>
  </Link>
}
