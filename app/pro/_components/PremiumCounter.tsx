import { MaterialSymbol } from './shared/MaterialSymbol'

export function PremiumCounter() {
  return (
    <section className="relative overflow-hidden bg-[var(--pro-primary)] px-6 py-16">
      <div className="absolute top-0 right-0 opacity-10">
        <MaterialSymbol name="potted_plant" className="rotate-12 !text-[300px] text-white" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 text-white md:flex-row">
        <div className="text-center md:text-left">
          <h2 className="mb-2 text-[32px] leading-[40px] font-bold">Únete a la nueva era</h2>
          <p className="text-base leading-6 text-[var(--pro-primary-fixed)] opacity-90">
            Ya somos más de 1,200 agro-exportadores esperando el lanzamiento.
          </p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-[48px] leading-[56px] font-bold tracking-[-0.02em] text-[var(--pro-secondary-fixed)]">
              95%
            </div>
            <div className="text-xs leading-4 font-bold tracking-widest uppercase opacity-70">Desarrollo</div>
          </div>
          <div className="text-center">
            <div className="text-[48px] leading-[56px] font-bold tracking-[-0.02em] text-[var(--pro-secondary-fixed)]">
              Q4
            </div>
            <div className="text-xs leading-4 font-bold tracking-widest uppercase opacity-70">Lanzamiento</div>
          </div>
        </div>
      </div>
    </section>
  )
}
