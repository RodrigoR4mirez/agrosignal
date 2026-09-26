import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/auth/AuthCard'
import { LoginForm } from '@/components/auth/LoginForm'
import { getProfile } from '@/lib/supabase/auth'
import { ROLE_HOME, safeNext } from '@/lib/supabase/types'

const notices: Record<string, string> = {
  sesion: 'Inicia sesión para continuar.', perfil: 'No pudimos cargar tu perfil. Intenta ingresar otra vez.',
  salida: 'Cerraste sesión correctamente.', password: 'Tu contraseña se actualizó. Ingresa con tu nueva contraseña.',
  enlace: 'Este enlace venció o ya fue utilizado. Solicita uno nuevo para confirmar tu correo o recuperar tu contraseña.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ aviso?: string; next?: string }> }) {
  const params = await searchParams
  const profile = await getProfile()
  if (profile && !profile.suspendido && profile.email_confirmed) redirect(ROLE_HOME[profile.rol])
  return <AuthCard title="Vuelve a tu campo" description="Ingresa para gestionar tus cosechas o encontrar tu próxima compra.">
    {params.aviso && notices[params.aviso] && <p role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{notices[params.aviso]}</p>}
    <LoginForm next={params.next ? safeNext(params.next) : undefined} />
    <p className="mt-6 text-center text-sm text-gray-600">¿Aún no tienes cuenta? <Link href="/registro" className="font-semibold text-[#1a5c2a] underline">Regístrate gratis</Link></p>
    <p className="mt-4 text-center text-sm"><Link href="/verificar-correo" className="text-[#1a5c2a] underline">Reenviar correo de verificación</Link></p>
  </AuthCard>
}
