import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/supabase/auth'
import { ROLE_HOME } from '@/lib/supabase/types'

export default async function AccountPage() {
  const profile = await requireRole()
  redirect(ROLE_HOME[profile.rol])
}
