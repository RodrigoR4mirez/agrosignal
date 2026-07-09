import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AgroSignal — Inteligencia para el campo peruano',
  description: 'Anticipa la cosecha, asegura tu negocio. Datos climáticos y predictivos para agricultores y compradores del Perú.',
  keywords: 'agricultura, cosecha, Perú, datos, clima, riesgo agrícola',
  openGraph: {
    title: 'AgroSignal',
    description: 'Anticipa la cosecha, asegura tu negocio.',
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
    <html lang="es" className={jakarta.variable}>
      <body style={{ margin: 0, padding: 0 }} className="font-sans">
        {children}
      </body>
    </html>
  )
}
