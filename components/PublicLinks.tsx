import Link from 'next/link'

export function PublicLinks() {
  return <nav aria-label="Secciones de AgroSignal" className="border-b border-gray-100 bg-white"><div className="app-container flex flex-wrap gap-x-6 px-4 text-sm font-semibold text-[#1a5c2a] sm:px-6 lg:px-8"><Link href="/marketplace" className="inline-flex min-h-11 items-center">Marketplace</Link><Link href="/mi-cuenta" className="inline-flex min-h-11 items-center">Mi cuenta</Link><Link href="/ayuda" className="inline-flex min-h-11 items-center">Ayuda y preguntas frecuentes</Link></div></nav>
}
