import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { IconoBrote } from '@/components/landing/Iconos'
import { getProfile } from '@/lib/supabase/auth'
import { ROLE_HOME, ROLE_LABEL, type Profile } from '@/lib/supabase/types'

// Encabezado y pie con la identidad de la landing: marca AGROSIGNAL, petróleo y naranja.
// anchoCompleto deja que la página maneje su propio ancho (bandas a sangre).
export async function AppShell({ children, profile: suppliedProfile, anchoCompleto = false }: { children: React.ReactNode; profile?: Profile | null; anchoCompleto?: boolean }) {
  const profile = suppliedProfile === undefined ? await getProfile() : suppliedProfile
  return <div className="flex min-h-screen flex-col">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Saltar al contenido</a>
    <header className="sticky top-0 z-30 border-b border-[#ebe4d4] bg-white/95 backdrop-blur-md">
      <div className="app-container flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" translate="no" className="flex items-center gap-2 text-[22px] font-light tracking-[0.06em] text-petroleo"><IconoBrote className="size-7 text-musgo" />AGROSIGNAL</Link>
        <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-x-3 gap-y-3 text-[13px] font-semibold sm:gap-x-5 sm:text-sm">
          <Link href="/" aria-label="Inicio" title="Inicio" className="-ml-2 grid size-9 place-items-center rounded-full text-gray-700 sm:ml-0 sm:size-10 transition-colors hover:bg-crema hover:text-petroleo">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></svg>
          </Link>
          <Link href="/marketplace" className="text-gray-700 hover:text-petroleo">Productos</Link>
          <Link href="/marketplace/precios" className="hidden text-gray-700 hover:text-petroleo sm:inline">Precios</Link>
          <Link href="/ayuda" className="text-gray-700 hover:text-petroleo">Ayuda</Link>
          {profile ? <>
            <Link href={profile.suspendido ? '/cuenta-suspendida' : ROLE_HOME[profile.rol]} className="text-petroleo">Mi panel</Link>
            <form action={logoutAction}><button className="min-h-10 rounded-full border border-petroleo/25 px-3 text-petroleo hover:bg-crema sm:px-4">Cerrar sesión</button></form>
          </> : <>
            <Link href="/login" className="text-petroleo">Ingresar</Link>
            <Link href="/registro" className="rounded-full bg-naranja px-4 py-2.5 text-petroleo sm:px-5 transition-colors hover:bg-[#f29a5e]">Crear cuenta</Link>
          </>}
        </nav>
      </div>
    </header>
    {profile && <div className="border-b border-[#ebe4d4] bg-crema"><p className="app-container px-4 py-2 text-xs text-petroleo wrap-anywhere sm:px-6 lg:px-8">{profile.nombre_completo} · {ROLE_LABEL[profile.rol]}</p></div>}
    <main id="contenido" className={anchoCompleto ? 'flex-1' : 'app-container flex-1 px-4 py-8 sm:px-6 lg:px-8'}>{children}</main>
    <footer className={`bg-petroleo text-white ${anchoCompleto ? '' : 'mt-12'}`}>
      <div className="app-container flex flex-wrap items-end justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div><p translate="no" className="flex items-center gap-2 text-2xl font-light tracking-[0.06em]"><IconoBrote className="size-8 text-[#b9d99a]" />AGROSIGNAL</p><p className="mt-2 text-sm text-white/75">Conectamos el campo peruano con quien compra su cosecha.</p></div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/85"><Link href="/" className="hover:text-white">Inicio</Link><Link href="/marketplace" className="hover:text-white">Productos</Link><Link href="/ayuda" className="hover:text-white">Ayuda y preguntas frecuentes</Link></nav>
      </div>
    </footer>
  </div>
}
