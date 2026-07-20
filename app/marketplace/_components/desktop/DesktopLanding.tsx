import { AsesoriaComunidad } from './AsesoriaComunidad'
import { ComoFunciona } from './ComoFunciona'
import { Cosechas } from './Cosechas'
import { CtaFinal } from './CtaFinal'
import { Ecosistema } from './Ecosistema'
import { Exportacion } from './Exportacion'
import { Footer } from './Footer'
import { Hero } from './Hero'
import { MapaRiesgo } from './MapaRiesgo'
import { Nav } from './Nav'
import { SelloInocuidad } from './SelloInocuidad'
import { Testimonios } from './Testimonios'
import { Transporte } from './Transporte'
import { TrustBar } from './TrustBar'

export function DesktopLanding() {
  return (
    <div className="hidden lg:block">
      <Nav />
      <Hero />
      <TrustBar />
      <Ecosistema />
      <MapaRiesgo />
      <Transporte />
      <Exportacion />
      <SelloInocuidad />
      <Cosechas />
      <AsesoriaComunidad />
      <ComoFunciona />
      <Testimonios />
      <CtaFinal />
      <Footer />
    </div>
  )
}
