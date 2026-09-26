import { requireRole } from '@/lib/supabase/auth'
import { RolePanel } from '@/components/RolePanel'

export default async function BuyerPanel({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const profile = await requireRole('comprador')
  const params = await searchParams
  return <RolePanel profile={profile} denied={params.aviso === 'sin-permiso'} />
}
