export function TrustBar() {
  return (
    <section className="relative overflow-hidden bg-[var(--ms-primary-container)] py-12 text-white">
      <div className="ms-container relative z-10 flex flex-wrap items-center justify-center gap-12 px-6 lg:gap-24">
        <div className="group text-center">
          <div className="mb-1 text-4xl font-extrabold text-[var(--ms-secondary-container)] transition-transform group-hover:scale-110">
            25
          </div>
          <div className="text-sm font-medium tracking-widest uppercase opacity-80">Regiones del Perú</div>
        </div>
        <div className="hidden h-12 w-px bg-white/20 lg:block" />
        <div className="group text-center">
          <div className="mb-1 text-4xl font-extrabold text-[var(--ms-secondary-container)] transition-transform group-hover:scale-110">
            +30
          </div>
          <div className="text-sm font-medium tracking-widest uppercase opacity-80">Cultivos Monitoreados</div>
        </div>
        <div className="hidden h-12 w-px bg-white/20 lg:block" />
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium tracking-widest uppercase opacity-80">Respaldado por:</span>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tighter">NASA</span>
            <span className="text-xl font-bold tracking-tighter">FAO</span>
            <span className="text-xl font-bold tracking-tighter">MIDAGRI</span>
          </div>
        </div>
      </div>
    </section>
  )
}
