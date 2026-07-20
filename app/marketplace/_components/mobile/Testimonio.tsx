import { MaterialSymbol } from '../shared/MaterialSymbol'

export function Testimonio() {
  return (
    <section className="bg-[var(--ms-surface-container)] px-6 py-12">
      <div className="mb-8 text-center">
        <MaterialSymbol name="format_quote" className="!text-4xl text-[var(--ms-secondary)]" />
        <p className="mt-4 text-base leading-6 text-[var(--ms-on-surface)] italic">
          &quot;Con AgroSignal reduje mis pérdidas por heladas en un 30% en mi primera campaña. La data es el mejor
          fertilizante.&quot;
        </p>
        <div className="mt-6">
          <p className="font-bold text-[var(--ms-primary)]">Jorge Santisteban</p>
          <p className="text-sm text-[var(--ms-on-surface-variant)]">Productor de Uva - Piura</p>
        </div>
      </div>
    </section>
  )
}
