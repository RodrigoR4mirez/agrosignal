import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { getProfile } from '@/lib/supabase/auth'
import { ROLE_HOME } from '@/lib/supabase/types'

export default async function RegisterPage() {
  const profile = await getProfile()
  if (profile && !profile.suspendido && profile.email_confirmed) redirect(ROLE_HOME[profile.rol])
  return <AuthCard title="Crece con AgroSignal" description="Crea tu cuenta gratis. Conecta directamente con productores y compradores del Perú.">
    <RegisterForm />
    <p className="mt-6 text-center text-sm text-gray-600">¿Ya tienes cuenta? <Link href="/login" className="font-semibold text-petroleo underline">Ingresar</Link></p>
  </AuthCard>
}
