import type { Metadata } from 'next'
import { DesktopLanding } from './_components/desktop/DesktopLanding'
import { MobileHome } from './_components/mobile/MobileHome'

export const metadata: Metadata = {
  title: 'AgroSignal Marketplace — Vende, transporta y exporta tu cosecha',
  description:
    'Ecosistema integral para el agro peruano: venta anticipada, transporte compartido, exportación directa y mapas de riesgo agrometeorológico.',
}

export default function MarketplacePage() {
  return (
    <div className="marketplace-scope min-h-screen">
      <DesktopLanding />
      <MobileHome />
    </div>
  )
}
