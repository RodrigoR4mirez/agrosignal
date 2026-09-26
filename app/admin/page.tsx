import { requireRole } from '@/lib/supabase/auth'
import { RolePanel } from '@/components/RolePanel'

export default async function AdminPanel({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const profile = await requireRole('admin')
  const params = await searchParams
  return <RolePanel profile={profile} denied={params.aviso === 'sin-permiso'} />
}
