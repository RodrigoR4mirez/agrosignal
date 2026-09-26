import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
export default function SaleNotFound() {
  return <AppShell><h1 className="mb-4 text-2xl font-bold text-[#1a5c2a]">No encontramos este pedido en tus ventas</h1><Link href="/panel-productor" className="font-semibold text-[#1a5c2a] underline">Volver a Mis ventas</Link></AppShell>
}
