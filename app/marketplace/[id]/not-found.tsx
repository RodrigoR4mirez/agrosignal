import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
export default function LotNotFound() {
  return <AppShell><Card className="py-12 text-center"><h1 className="mb-4 text-2xl font-bold text-[#1a5c2a]">Este lote no está disponible</h1><p className="mb-6 text-sm text-gray-600">Puede estar agotado, retirado o pendiente de publicación.</p><Link href="/marketplace" className="font-semibold text-[#1a5c2a] underline">Explorar otras cosechas</Link></Card></AppShell>
}
