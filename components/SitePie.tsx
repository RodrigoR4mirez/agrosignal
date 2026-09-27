import Link from 'next/link'
import { IconoBrote } from '@/components/landing/Iconos'
import { CONTACTO } from '@/lib/contacto/types'

const COLUMNAS: [string, [string, string][]][] = [
  ['Marketplace', [['/marketplace', 'Productos'], ['/marketplace/precios', 'Precios del mercado'], ['/registro?rol=productor', 'Vender mi cosecha'], ['/registro?rol=comprador', 'Comprar directo del campo']]],
  ['AgroSignal', [['/#que-es', 'Qué es AgroSignal'], ['/#como-funciona', 'Cómo funciona'], ['/ayuda#niveles', 'Verificación AgroSignal'], ['/ayuda', 'Ayuda y preguntas frecuentes']]],
]
const titulo = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'
const enlace = 'text-sm text-white/75 transition-colors hover:text-white'

// Pie del sitio (landing y páginas internas): marca, enlaces, contacto y créditos.
// panel: con sesión, el llamado a crear cuenta cambia a "Ir a mi panel".
export function SitePie({ panel, invitacion = false, contenedor = 'app-container px-4 sm:px-6 lg:px-8' }: { panel?: string | null; invitacion?: boolean; contenedor?: string }) {
  return <footer className="bg-petroleo text-white">
    <div className={contenedor}>
      {invitacion && <div className="flex flex-col gap-6 border-b border-white/10 py-14 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-[28px] font-light leading-tight">Únete a la comunidad</h2><p className="mt-2 max-w-md text-[15px] text-white/70">Crea tu cuenta gratis como productor o comprador y empieza a publicar o pedir cosechas hoy.</p></div>
        <div className="flex flex-wrap gap-3">{panel ? <Link href={panel} className="rounded-full bg-naranja px-6 py-2.5 text-sm font-semibold text-petroleo hover:bg-[#f29a5e]">Ir a mi panel</Link> : <>
          <Link href="/registro" className="rounded-full bg-naranja px-6 py-2.5 text-sm font-semibold text-petroleo hover:bg-[#f29a5e]">Crear cuenta</Link>
          <Link href="/login" className="rounded-full px-6 py-2.5 text-sm font-semibold ring-1 ring-white/30 hover:bg-white/10">Ingresar</Link>
        </>}</div>
      </div>}

      <div className="grid grid-cols-2 gap-x-6 gap-y-12 py-14 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" translate="no" className="inline-flex items-center gap-2 text-2xl font-light tracking-[0.06em]"><IconoBrote className="size-8 text-[#b9d99a]" />AGROSIGNAL</Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">Conectamos el campo peruano con quien compra su cosecha, con lotes verificados y reputación a la vista.</p>
          <Link href="/contacto" className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold ring-1 ring-white/25 transition hover:bg-white/10">Contáctanos<svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
        </div>
        {COLUMNAS.map(([nombre, enlaces]) => <nav key={nombre} aria-label={nombre}>
          <p className={titulo}>{nombre}</p>
          <ul className="mt-5 space-y-3">{enlaces.map(([href, texto]) => <li key={href}><Link href={href} className={enlace}>{texto}</Link></li>)}</ul>
        </nav>)}
        <div className="col-span-2 lg:col-span-1">
          <p className={titulo}>Contacto</p>
          <ul className="mt-5 space-y-3 text-sm text-white/75">
            <li><a href={`mailto:${CONTACTO.correo}`} className={enlace}>{CONTACTO.correo}</a></li>
            <li>{CONTACTO.ciudad}</li>
            <li className="leading-relaxed">{CONTACTO.horario}</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 py-7 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} AgroSignal. Todos los derechos reservados.</p>
        <p>Desarrollado por <span className="font-semibold text-white/75">{CONTACTO.consultora}</span></p>
      </div>
    </div>
  </footer>
}
