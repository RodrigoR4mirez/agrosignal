export function CtaCredito() {
  return (
    <section className="px-6 py-12">
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-[1.5rem] p-8">
        <div className="absolute inset-0 bg-[var(--ms-secondary-fixed)]" />
        <div className="relative z-10 space-y-4">
          <h3 className="text-2xl leading-[32px] font-bold text-[var(--ms-on-secondary-fixed)]">
            ¿Necesitas capital para la campaña?
          </h3>
          <p className="text-sm leading-5 text-[var(--ms-on-secondary-fixed-variant)]">
            Créditos rápidos con tasas preferenciales para productores AgroSignal.
          </p>
          <button className="mt-4 w-full rounded-[0.75rem] bg-[var(--ms-primary)] py-4 text-xl leading-[28px] font-semibold text-white">
            Simular Crédito
          </button>
        </div>
      </div>
    </section>
  )
}
