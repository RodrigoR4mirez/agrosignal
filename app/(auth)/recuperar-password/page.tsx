import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { EmailForm } from '@/components/auth/FormFields'
import { recoverAction } from '../actions'

export default function RecoverPage() {
  return <AuthCard title="Recupera tu acceso" description="Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.">
    <EmailForm action={recoverAction} label="Enviar enlace de recuperación" />
    <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-petroleo underline">Volver a ingresar</Link>
  </AuthCard>
}
