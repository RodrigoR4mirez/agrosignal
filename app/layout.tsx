import type { Metadata } from 'next'
import './globals.css'

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f5f7f2' }}>
        {children}
      </body>
    </html>
  )
}
