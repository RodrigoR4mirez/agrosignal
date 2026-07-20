import type { Metadata } from 'next'
import './marketplace.css'

export const metadata: Metadata = {
  title: 'AgroSignal Marketplace',
  description: 'Ecosistema integral para productores, compradores y transportistas del agro peruano.',
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
