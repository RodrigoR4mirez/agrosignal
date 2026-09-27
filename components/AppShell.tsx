import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { getProfile } from '@/lib/supabase/auth'
import { ROLE_HOME, ROLE_LABEL, type Profile } from '@/lib/supabase/types'

// ancho="completo": la página maneja sus propios márgenes (landing con franjas a sangre).
export async function AppShell({ children, profile: suppliedProfile, ancho = 'contenido' }: { children: React.ReactNode; profile?: Profile | null; ancho?: 'contenido' | 'completo' }) {
  const profile = suppliedProfile === undefined ? await getProfile() : suppliedProfile
  return <div className="flex min-h-screen flex-col">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Saltar al contenido</a>
    <header className="sticky top-0 z-30 border-b border-[#dfe3d4] bg-[#eef0e6]/90 backdrop-blur-md">
      <div className="app-container flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" translate="no" className="font-display text-2xl font-semibold text-bosque">Agro<span className="text-tierra">Signal</span></Link>
        <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold">
          <Link href="/marketplace" className="text-gray-700 hover:text-bosque">Productos</Link>
          <Link href="/ayuda" className="text-gray-700 hover:text-bosque">Ayuda</Link>
          {profile ? <>
            <Link href={profile.suspendido ? '/cuenta-suspendida' : ROLE_HOME[profile.rol]} className="text-bosque">Mi panel</Link>
            <form action={logoutAction}><button className="min-h-10 rounded-full border border-bosque/25 px-4 hover:bg-white/70">Cerrar sesión</button></form>
          </> : <>
            <Link href="/login" className="text-bosque">Ingresar</Link>
            <Link href="/registro" className="rounded-full bg-bosque px-5 py-2.5 text-white hover:bg-bosque-claro">Crear cuenta</Link>
          </>}
        </nav>
      </div>
    </header>
    {profile && <div className="border-b border-green-100 bg-green-50"><p className="app-container px-4 py-2 text-xs text-green-900 wrap-anywhere sm:px-6 lg:px-8">{profile.nombre_completo} · {ROLE_LABEL[profile.rol]}</p></div>}
    <main id="contenido" className={ancho === 'completo' ? 'flex-1' : 'app-container flex-1 px-4 py-8 sm:px-6 lg:px-8'}>{children}</main>
    <footer className={`leaf-texture text-arena-claro ${ancho === 'completo' ? '' : 'mt-12'}`}>
      <div className="app-container flex flex-wrap items-end justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div><p translate="no" className="font-display text-2xl text-white">AgroSignal</p><p className="mt-1 text-sm text-arena-claro/80">Conectamos el campo peruano con quien compra su cosecha.</p></div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"><Link href="/marketplace" className="hover:text-white">Productos</Link><Link href="/ayuda" className="underline underline-offset-4 hover:text-white">Ayuda y preguntas frecuentes</Link></nav>
      </div>
    </footer>
  </div>
}
