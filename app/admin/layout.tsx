import { AppShell } from '@/components/AppShell'
import { AdminNav } from '@/components/admin/AdminNav'
import { ActionFeedback } from '@/components/ActionFeedback'
import { requireRole } from '@/lib/supabase/auth'
import { TemaVidrio } from '@/components/admin/TemaVidrio'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole('admin')
  return <TemaVidrio><AppShell profile={profile}><ActionFeedback><div className="grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)]"><AdminNav /><div className="min-w-0">{children}</div></div></ActionFeedback></AppShell></TemaVidrio>
}
