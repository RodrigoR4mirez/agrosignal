import { FeatureTeasers } from './_components/FeatureTeasers'
import { Footer } from './_components/Footer'
import { Hero } from './_components/Hero'
import { Nav } from './_components/Nav'
import { PremiumCounter } from './_components/PremiumCounter'

export default function ProPage() {
  return (
    <div className="pro-scope min-h-screen overflow-x-hidden selection:bg-[var(--pro-secondary-fixed)] selection:text-[var(--pro-on-secondary-fixed)]">
      <Nav />
      <main className="relative pt-24">
        <Hero />
        <FeatureTeasers />
        <PremiumCounter />
      </main>
      <Footer />
    </div>
  )
}
