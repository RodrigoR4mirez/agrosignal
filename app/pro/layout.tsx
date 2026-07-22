import type { Metadata } from 'next'
import './pro.css'

export const metadata: Metadata = {
  title: 'AgroSignal PRO — Próximamente',
  description: 'Únete a la lista de espera de AgroSignal PRO: inteligencia global, logística en tiempo real y comunidad premium para el agro peruano.',
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
