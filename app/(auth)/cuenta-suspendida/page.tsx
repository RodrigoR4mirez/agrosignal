import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'

export default function SuspendedPage() {
  return <AuthCard title="Tu cuenta está suspendida" description="El equipo de AgroSignal restringió temporalmente las operaciones de tu cuenta.">
    <p className="text-sm leading-relaxed text-gray-600">Puedes seguir explorando el marketplace público. Consulta Ayuda para conocer qué hacer si crees que se trata de un error.</p>
    <Link href="/ayuda#cuenta-suspendida" className="mt-5 inline-block font-semibold text-[#1a5c2a] underline">Ver ayuda de cuenta</Link>
  </AuthCard>
}
