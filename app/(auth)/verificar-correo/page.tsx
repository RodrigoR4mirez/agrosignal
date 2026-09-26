import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { EmailForm } from '@/components/auth/FormFields'
import { resendAction } from '../actions'

export default function VerifyEmailPage() {
  return <AuthCard title="Confirma tu correo" description="Abre el enlace que recibiste para activar tu cuenta. Revisa también la carpeta de spam.">
    <p className="mb-5 rounded-xl bg-green-50 p-4 text-sm leading-relaxed text-green-900">Puedes explorar el marketplace ahora. Para publicar o comprar, primero debes confirmar tu correo.</p>
    <details className="rounded-xl border border-gray-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-[#1a5c2a]">No recibí el correo</summary><div className="mt-5"><EmailForm action={resendAction} label="Reenviar verificación" /></div></details>
    <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-[#1a5c2a]"><Link href="/marketplace" className="underline">Explorar marketplace</Link><Link href="/login" className="underline">Ya confirmé mi correo</Link></div>
  </AuthCard>
}
