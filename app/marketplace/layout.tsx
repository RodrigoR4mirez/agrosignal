import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AgroSignal Marketplace',
  description: 'Lotes agrícolas publicados por productores peruanos.',
}

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>
    {/* Íconos de la portada (Material Symbols); display=block evita ver el nombre del ícono mientras carga */}
    {/* eslint-disable-next-line @next/next/google-font-display, @next/next/no-page-custom-font -- fuente de íconos: block es lo correcto y el layout la carga en todo /marketplace */}
    <link rel="stylesheet" precedence="default" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=block" />
    {children}
  </>
}
