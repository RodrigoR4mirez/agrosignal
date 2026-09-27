import type { Metadata, Viewport } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

// Serif orgánica para títulos; el texto corrido sigue en Plus Jakarta Sans.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'opsz'],
})

export const metadata: Metadata = {
  title: 'AgroSignal — Marketplace de cosechas del Perú',
  description: 'Compra cosechas directo de productores peruanos. Compara lotes, revisa sus verificaciones y haz tu pedido sin intermediarios.',
  keywords: 'marketplace agrícola, cosechas, productores, Perú, palta, café, cacao, arándano',
  openGraph: {
    title: 'AgroSignal',
    description: 'Cosechas peruanas, directo de quien las cultiva.',
    type: 'website',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a5c2a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${jakarta.variable} ${fraunces.variable}`} data-scroll-behavior="smooth">
      <body style={{ margin: 0, padding: 0 }} className="font-sans">
        {children}
      </body>
    </html>
  )
}
