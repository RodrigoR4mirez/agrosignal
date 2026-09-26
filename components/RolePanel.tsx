import Link from 'next/link'
import { AppShell } from './AppShell'
import { Card } from './ui/Card'
import type { Profile } from '@/lib/supabase/types'
import { ROLE_LABEL } from '@/lib/supabase/types'

export function RolePanel({ profile, denied }: { profile: Profile; denied?: boolean }) {
  return <AppShell profile={profile}>
    {denied && <p role="alert" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No tienes permiso para ver esta página.</p>}
    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#b8860f]">Mi espacio · {ROLE_LABEL[profile.rol]}</p>
    <h1 className="mb-6 text-3xl font-extrabold text-[#1a5c2a]">Hola, {profile.nombre_completo}</h1>
    <div className="grid gap-6 md:grid-cols-2"><Card><h2 className="mb-4 text-xl font-bold">Tu cuenta está lista</h2><dl className="space-y-3 text-sm"><div><dt className="text-gray-500">Correo verificado</dt><dd className="break-all font-medium">{profile.email}</dd></div><div><dt className="text-gray-500">Tipo de cuenta</dt><dd className="font-medium">{ROLE_LABEL[profile.rol]}</dd></div>{profile.region && <div><dt className="text-gray-500">Región</dt><dd className="font-medium">{profile.region}</dd></div>}</dl><Link href="/actualizar-password" className="mt-6 inline-block text-sm font-semibold text-[#1a5c2a] underline">Cambiar contraseña</Link></Card>
    <Card><h2 className="mb-3 text-xl font-bold">Conecta con el campo</h2><p className="mb-5 text-sm leading-relaxed text-gray-600">Explora las cosechas disponibles y consulta el riesgo climático de tu región.</p><div className="flex flex-wrap gap-4 text-sm font-semibold text-[#1a5c2a]"><Link href="/marketplace" className="underline">Ir al marketplace</Link><Link href="/" className="underline">Ver riesgo climático</Link><Link href="/ayuda" className="underline">Consultar ayuda</Link></div></Card></div>
  </AppShell>
}
