import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'

// Login, registro y cuenta no deben salir en buscadores; los enlaces sí se siguen.
export const metadata: Metadata = { robots: { index: false, follow: true } }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
