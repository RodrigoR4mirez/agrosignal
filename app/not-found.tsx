import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'

export default function NotFound() {
  return <AppShell profile={null}><Card className="mx-auto max-w-xl space-y-5"><p className="text-sm font-semibold text-tierra">Página no encontrada</p><h1 className="text-3xl font-normal sm:text-4xl text-petroleo">Este enlace no está disponible</h1><p className="text-sm leading-relaxed text-gray-600">Revisa la dirección o continúa desde el marketplace.</p><div className="flex flex-wrap gap-5"><Link href="/marketplace" className="inline-flex min-h-11 items-center font-semibold text-petroleo underline">Ir al marketplace</Link><Link href="/ayuda" className="inline-flex min-h-11 items-center font-semibold text-petroleo underline">Consultar ayuda</Link></div></Card></AppShell>
}
