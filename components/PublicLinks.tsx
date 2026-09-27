import Link from 'next/link'

const LINKS = [
  { href: '/', label: 'Riesgo climático' },
  { href: '/fenomeno-nino', label: 'El Niño 2026–27' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/ayuda', label: 'Ayuda' },
  { href: '/mi-cuenta', label: 'Mi cuenta' },
]

export function PublicLinks({ actual }: { actual?: string }) {
  return <nav aria-label="Secciones de AgroSignal" className="border-b border-gray-100 bg-white"><div className="app-container flex flex-wrap gap-x-6 px-4 text-sm font-semibold sm:px-6 lg:px-8">{LINKS.map(link => {
    const activo = link.href === actual
    return <Link key={link.href} href={link.href} aria-current={activo ? 'page' : undefined} className={`inline-flex min-h-11 items-center border-b-2 ${activo ? 'border-[#d4a017] text-[#1a5c2a]' : 'border-transparent text-gray-600 hover:text-[#1a5c2a]'}`}>{link.label}</Link>
  })}</div></nav>
}
