import Link from 'next/link'
import { logoutAction } from '@/app/(auth)/actions'
import { getProfile } from '@/lib/supabase/auth'
import { ROLE_HOME, ROLE_LABEL, type Profile } from '@/lib/supabase/types'

export async function AppShell({ children, profile: suppliedProfile }: { children: React.ReactNode; profile?: Profile | null }) {
  const profile = suppliedProfile === undefined ? await getProfile() : suppliedProfile
  return <div className="min-h-screen">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Saltar al contenido</a>
    <header className="border-b border-gray-200 bg-white">
      <div className="app-container flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/marketplace" className="text-xl font-extrabold tracking-tight text-[#1a5c2a]">Agro<span className="text-[#b8860f]">Signal</span></Link>
        <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold">
          <Link href="/marketplace" className="text-gray-700 hover:text-[#1a5c2a]">Marketplace</Link>
          <Link href="/" className="text-gray-700 hover:text-[#1a5c2a]">Riesgo climático</Link>
          <Link href="/ayuda" className="text-gray-700 hover:text-[#1a5c2a]">Ayuda</Link>
          {profile ? <>
            <Link href={profile.suspendido ? '/cuenta-suspendida' : ROLE_HOME[profile.rol]} className="text-[#1a5c2a]">Mi panel</Link>
            <form action={logoutAction}><button className="min-h-10 rounded-lg border border-gray-300 px-3 hover:bg-gray-50">Cerrar sesión</button></form>
          </> : <>
            <Link href="/login" className="text-[#1a5c2a]">Ingresar</Link>
            <Link href="/registro" className="rounded-lg bg-[#1a5c2a] px-4 py-2.5 text-white">Crear cuenta</Link>
          </>}
        </nav>
      </div>
    </header>
    {profile && <div className="border-b border-green-100 bg-green-50"><p className="app-container px-4 py-2 text-xs text-green-900 sm:px-6 lg:px-8">{profile.nombre_completo} · {ROLE_LABEL[profile.rol]}</p></div>}
    <main id="contenido" className="app-container px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    <footer className="app-container flex flex-wrap justify-between gap-3 px-4 py-8 text-sm text-gray-600 sm:px-6 lg:px-8">
      <p>AgroSignal · Conectamos el campo peruano</p><Link href="/ayuda" className="font-semibold text-[#1a5c2a] underline underline-offset-4">Ayuda y preguntas frecuentes</Link>
    </footer>
  </div>
}
