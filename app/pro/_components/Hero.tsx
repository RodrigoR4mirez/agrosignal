import { MaterialSymbol } from './shared/MaterialSymbol'
import { WaitlistForm } from './WaitlistForm'

export function Hero() {
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-7xl flex-col items-center justify-between gap-12 px-6 lg:flex-row">
      <div className="w-full space-y-8 lg:w-1/2">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--pro-secondary-container)] px-4 py-2 text-xs leading-4 font-bold text-[var(--pro-on-secondary-container)]">
          <MaterialSymbol name="trending_up" filled className="!text-base animate-pulse" />
          Alta Demanda: Cupos Limitados
        </div>
        <h1 className="text-[48px] leading-[1.1] font-bold tracking-[-0.02em] text-[var(--pro-primary)] md:text-[56px]">
          AgroSignal <span className="text-[var(--pro-secondary)]">PRO</span>: <br />
          <span className="text-[var(--pro-on-surface)]">La Inteligencia que el Campo Esperaba</span>
        </h1>
        <p className="max-w-lg text-base leading-6 text-[var(--pro-on-surface-variant)]">
          Elevamos la tecnología agrícola al siguiente nivel. Datos de precisión satelital, logística inteligente y
          una comunidad exclusiva de agro-líderes peruanos.
        </p>
        <WaitlistForm />
      </div>
      <div className="relative w-full lg:w-1/2">
        <div className="pro-floating relative z-10">
          <div className="aspect-square w-full overflow-hidden rounded-[40px] border-8 border-white shadow-2xl">
            <img
              src="/pro/hero-agricultor-tablet.jpg"
              alt="Agricultor peruano usando tablet con datos de AgroSignal PRO en el campo"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="pro-glass-card absolute -top-6 -right-6 flex items-center gap-3 rounded-2xl border-2 border-[var(--pro-secondary-fixed)] p-4 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pro-secondary-fixed-dim)] text-[var(--pro-on-secondary-fixed)]">
              <MaterialSymbol name="analytics" />
            </div>
            <div>
              <p className="text-xs leading-4 font-bold text-[var(--pro-secondary)]">Rendimiento PRO</p>
              <p className="text-xl leading-7 font-semibold">+24% Real-time</p>
            </div>
          </div>
          <div className="pro-glass-card absolute -bottom-8 -left-8 flex items-center gap-3 rounded-2xl border-2 border-[var(--pro-primary-fixed)] p-4 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pro-primary-container)] text-[var(--pro-on-primary-container)]">
              <MaterialSymbol name="satellite_alt" />
            </div>
            <div>
              <p className="text-xs leading-4 font-bold text-[var(--pro-primary)]">Precisión Satelital</p>
              <p className="text-sm leading-5">Cerrando en 0.5m</p>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--pro-secondary)]/5 blur-3xl" />
      </div>
    </section>
  )
}
