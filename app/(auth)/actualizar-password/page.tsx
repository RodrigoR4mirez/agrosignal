import { AuthCard } from '@/components/auth/AuthCard'
import { PasswordForm } from '@/components/auth/PasswordForm'
import { requireRole } from '@/lib/supabase/auth'

export default async function UpdatePasswordPage() {
  await requireRole()
  return <AuthCard title="Elige una contraseña nueva" description="Usa una contraseña que no utilices en otros servicios."><PasswordForm /></AuthCard>
}
