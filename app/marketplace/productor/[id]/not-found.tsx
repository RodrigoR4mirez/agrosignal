import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'
export default function ProductorNotFound() {
  return <AppShell><Card className="py-12 text-center"><h1 className="mb-4 text-2xl font-normal sm:text-3xl text-petroleo">Este perfil no está disponible</h1><p className="mb-6 text-sm text-gray-600">El productor puede haber dejado de publicar o su cuenta no está activa.</p><Link href="/marketplace" className="font-semibold text-petroleo underline">Explorar otras cosechas</Link></Card></AppShell>
}
