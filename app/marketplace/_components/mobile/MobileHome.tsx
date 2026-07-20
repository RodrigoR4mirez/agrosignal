import { BottomNav } from './BottomNav'
import { Comunidad } from './Comunidad'
import { CtaCredito } from './CtaCredito'
import { Faq } from './Faq'
import { Footer } from './Footer'
import { Hero } from './Hero'
import { Herramientas } from './Herramientas'
import { KpiMini } from './KpiMini'
import { MapaRiesgo } from './MapaRiesgo'
import { Noticias } from './Noticias'
import { Partners } from './Partners'
import { PreciosReferencia } from './PreciosReferencia'
import { Testimonio } from './Testimonio'
import { TopBar } from './TopBar'
import { TusLotes } from './TusLotes'

export function MobileHome() {
  return (
    <div className="lg:hidden">
      <TopBar />
      <main className="pb-16">
        <Hero />
        <KpiMini />
        <Herramientas />
        <MapaRiesgo />
        <TusLotes />
        <PreciosReferencia />
        <CtaCredito />
        <Noticias />
        <Testimonio />
        <Faq />
        <Partners />
        <Comunidad />
        <Footer />
      </main>
      <BottomNav />
    </div>
  )
}
