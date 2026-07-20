import { MaterialSymbol } from '../shared/MaterialSymbol'

export function KpiMini() {
  return (
    <section className="relative z-20 -mt-16 grid grid-cols-2 gap-3 px-6">
      <div className="flex flex-col gap-1 rounded-[1rem] border border-[var(--ms-outline-variant)]/30 bg-white p-4 shadow-sm">
        <span className="text-xs leading-4 font-bold text-[var(--ms-on-surface-variant)]">Dólar (S/)</span>
        <span className="text-2xl leading-[32px] font-bold text-[var(--ms-primary)]">3.74</span>
        <div className="flex items-center gap-1 text-green-600">
          <MaterialSymbol name="trending_up" className="!text-sm" />
          <span className="text-[10px] font-bold">+0.12%</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 rounded-[1rem] border border-[var(--ms-outline-variant)]/30 bg-white p-4 shadow-sm">
        <span className="text-xs leading-4 font-bold text-[var(--ms-on-surface-variant)]">Urea (TN)</span>
        <span className="text-2xl leading-[32px] font-bold text-[var(--ms-primary)]">S/ 2450</span>
        <div className="flex items-center gap-1 text-[var(--ms-error)]">
          <MaterialSymbol name="trending_down" className="!text-sm" />
          <span className="text-[10px] font-bold">-2.4%</span>
        </div>
      </div>
    </section>
  )
}
