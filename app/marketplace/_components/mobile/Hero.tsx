import { MaterialSymbol } from '../shared/MaterialSymbol'

export function Hero() {
  return (
    <section className="relative flex h-[600px] items-center overflow-hidden px-6">
      <div className="absolute inset-0 z-0">
        <img
          src="/marketplace/mobile-hero-campo.jpg"
          alt="Campo agrícola peruano durante la hora dorada"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ms-secondary-fixed)]/30 bg-[var(--ms-secondary)]/20 px-3 py-1 backdrop-blur-md">
          <MaterialSymbol name="stars" filled className="!text-sm text-[var(--ms-secondary-fixed)]" />
          <span className="text-[10px] font-bold tracking-widest text-[var(--ms-secondary-fixed)] uppercase">
            Nueva Era Agrícola
          </span>
        </div>
        <h2 className="text-[48px] leading-[56px] font-bold tracking-[-0.02em] text-white">
          Decisiones Datos, <br />
          Cosechas Éxito.
        </h2>
        <p className="max-w-[280px] text-base leading-6 text-white/80">
          Gestión inteligente de riesgos y mercados para el productor peruano moderno.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <button className="h-12 rounded-[0.75rem] bg-[var(--ms-primary)] text-xl leading-[28px] font-semibold text-white shadow-lg shadow-[var(--ms-primary)]/20">
            Empezar Ahora
          </button>
          <button className="ms-glass-card h-12 rounded-[0.75rem] border border-white/20 text-xl leading-[28px] font-semibold text-white">
            Ver Mercados
          </button>
        </div>
      </div>
    </section>
  )
}
