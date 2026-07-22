import Link from 'next/link'
import { MaterialSymbol } from '../shared/MaterialSymbol'
import { Ticker } from './Ticker'

export function Hero() {
  return (
    <header className="relative flex min-h-[921px] items-center overflow-hidden pt-24">
      <Ticker />
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[var(--ms-surface)] via-[var(--ms-surface)]/80 to-transparent" />
        <img src="/marketplace/hero-valle-sagrado.jpg" alt="Valle Sagrado del Perú al amanecer" className="h-full w-full object-cover" />
      </div>
      <div className="ms-container relative z-20 grid gap-12 px-6 lg:grid-cols-2">
        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ms-secondary)]/20 bg-[var(--ms-secondary-container)]/30 px-3 py-1 text-[var(--ms-secondary)]">
            <MaterialSymbol name="verified" className="!text-sm" />
            <span className="text-sm font-bold tracking-wider uppercase">Liderando el Agro 4.0</span>
          </div>
          <h1 className="text-[48px] leading-[56px] font-bold tracking-[-0.02em] text-[var(--ms-primary)]">
            Anticipa la cosecha, <span className="text-[var(--ms-secondary)]">asegura tu negocio.</span>
          </h1>
          <p className="text-xl leading-relaxed text-[var(--ms-on-surface-variant)]">
            Vende tu producción antes de cosechar, optimiza tu transporte con carga compartida, exporta con datos en
            tiempo real y aprende de la comunidad agrícola más grande del Perú.
          </p>
          <div className="flex max-w-lg items-center gap-2 rounded-[1.5rem] border border-[var(--ms-outline-variant)] bg-white p-2 shadow-xl">
            <MaterialSymbol name="search" className="ml-3 text-[var(--ms-outline)]" />
            <input
              className="flex-1 border-none py-3 text-lg text-[var(--ms-on-surface)] outline-none placeholder:text-[var(--ms-outline)]"
              placeholder="¿Qué cultivo te interesa?"
              type="text"
            />
            <Link href="/pro" className="rounded-[1rem] bg-[var(--ms-primary)] px-6 py-3 font-bold text-white">
              <span className="flex items-center gap-2">
                <MaterialSymbol name="lock" className="!text-sm text-[var(--ms-gold-accent)]" />
                Explorar
              </span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="flex items-center gap-2 rounded-[1rem] border-2 border-[var(--ms-primary)] px-6 py-3 font-bold text-[var(--ms-primary)] transition-colors hover:bg-[var(--ms-primary)]/5">
              <MaterialSymbol name="agriculture" /> Soy agricultor
            </button>
            <button className="flex items-center gap-2 rounded-[1rem] border-2 border-[var(--ms-primary)] px-6 py-3 font-bold text-[var(--ms-primary)] transition-colors hover:bg-[var(--ms-primary)]/5">
              <MaterialSymbol name="payments" /> Soy comprador
            </button>
            <a className="flex items-center gap-2 px-4 font-medium text-[var(--ms-on-surface-variant)] underline" href="#">
              Explorar sin cuenta
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
