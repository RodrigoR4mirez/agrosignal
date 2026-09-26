import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
export default function BuyerNotFound() {
  return <AppShell><h1 className="mb-4 text-2xl font-bold text-[#1a5c2a]">No encontramos esta compra o cosecha</h1><p className="mb-6 text-sm text-gray-600">El lote puede estar agotado o el pedido no pertenece a tu cuenta.</p><Link href="/panel-comprador" className="font-semibold text-[#1a5c2a] underline">Volver a Mis compras</Link></AppShell>
}
