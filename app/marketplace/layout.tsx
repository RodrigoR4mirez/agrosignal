import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgroSignal Marketplace',
  description: 'Lotes agrícolas publicados por productores peruanos.',
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
