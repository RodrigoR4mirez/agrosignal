import { randomUUID } from 'node:crypto'
import { AppShell } from '@/components/AppShell'
import { LotWizard } from '@/components/marketplace/LotWizard'
import { requireRole } from '@/lib/supabase/auth'
export default async function PublishLot() {
  const profile = await requireRole('productor')
  return <AppShell profile={profile}><div className="mb-8 text-center"><h1 className="mb-3 text-3xl font-extrabold text-[#1a5c2a]">Publica tu cosecha</h1><p className="text-sm text-gray-600">Cuéntanos qué ofreces y conecta con compradores de todo el Perú.</p></div><LotWizard id={randomUUID()} owner={profile.id} /></AppShell>
}
