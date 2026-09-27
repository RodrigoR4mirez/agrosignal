import Link from 'next/link'
import { getProfile } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { ROLE_HOME } from '@/lib/supabase/types'
import { AuthCard } from '@/components/auth/AuthCard'

export default async function SuspendedPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!profile.suspendido) redirect(ROLE_HOME[profile.rol])
  return <AuthCard title="Tu cuenta está suspendida" description="El equipo de AgroSignal restringió temporalmente las operaciones de tu cuenta.">
    {profile?.suspendido && profile.moderacion_motivo && <div className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><h2 className="mb-2 font-bold">Motivo de la suspensión</h2><p className="whitespace-pre-wrap wrap-anywhere">{profile.moderacion_motivo}</p></div>}
    <p className="text-sm leading-relaxed text-gray-600">Puedes seguir explorando el marketplace público. Consulta Ayuda para conocer qué hacer si crees que se trata de un error.</p>
    <Link href="/ayuda#cuenta-suspendida" className="mt-5 inline-block font-semibold text-[#1a5c2a] underline">Ver ayuda de cuenta</Link>
  </AuthCard>
}
