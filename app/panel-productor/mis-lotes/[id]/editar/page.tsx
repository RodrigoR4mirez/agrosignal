import { notFound } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { LotWizard } from '@/components/marketplace/LotWizard'
import { requireRole } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { uuidPattern, type Lote } from '@/lib/marketplace/types'
export default async function EditLot({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole('productor')
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const db = await createClient()
  const { data, error } = await db.from('lotes').select('*').eq('id', id).eq('productor_id', profile.id).maybeSingle()
  if (error) throw new Error('No se pudo cargar el lote.')
  if (!data) notFound()
  let recoveredPhotos: string[] = []
  if (data.borrador) {
    const { data: files } = await db.storage.from('fotos-lotes').list(`${profile.id}/${id}`, { limit: 6 })
    recoveredPhotos = (files ?? []).map(file => `${profile.id}/${id}/${file.name}`)
  }
  return <AppShell profile={profile}><h1 className="mb-8 text-center text-3xl font-normal sm:text-4xl text-petroleo">{data.borrador ? 'Completa tu borrador' : 'Editar lote'}</h1>{data.bloqueado && <p role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Este lote está bloqueado y no se muestra en el marketplace. Editarlo no levanta el bloqueo.</p>}<LotWizard id={id} owner={profile.id} initial={data as Lote} recoveredPhotos={recoveredPhotos} /></AppShell>
}
