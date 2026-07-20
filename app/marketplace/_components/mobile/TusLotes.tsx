import { MaterialSymbol } from '../shared/MaterialSymbol'
import { PlaceholderImage } from '../shared/PlaceholderImage'

const LOTES = [
  {
    icon: 'nutrition',
    title: 'Lote Arándanos A1',
    place: 'Ica, Valle Viejo',
    status: 'Óptimo',
    statusIcon: 'check_circle',
    statusClass: 'bg-[var(--ms-primary)]/10 text-[var(--ms-primary)]',
    note: 'Cosecha en 12d',
  },
  {
    icon: 'nutrition',
    title: 'Mango Exportación',
    place: 'Piura, Tambogrande',
    status: 'Riesgo Medio',
    statusIcon: 'info',
    statusClass: 'bg-[var(--ms-secondary-container)]/30 text-[var(--ms-secondary)]',
    note: 'Suelo seco',
  },
]

export function TusLotes() {
  return (
    <section className="space-y-6 px-6 py-8">
      <div className="flex items-end justify-between">
        <h3 className="text-2xl leading-[32px] font-bold text-[var(--ms-on-surface)]">Tus Lotes</h3>
        <span className="text-xs leading-4 font-bold text-[var(--ms-primary)]">Ver todos</span>
      </div>
      <div className="space-y-4">
        {LOTES.map((lote) => (
          <div
            key={lote.title}
            className="flex gap-4 rounded-[1rem] border border-[var(--ms-outline-variant)]/30 bg-white p-4 shadow-sm"
          >
            <PlaceholderImage icon={lote.icon} tone="primary" className="h-20 w-20 shrink-0 rounded-[0.75rem]" />
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h4 className="text-sm leading-tight font-semibold">{lote.title}</h4>
                <p className="text-[11px] text-[var(--ms-on-surface-variant)]">{lote.place}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${lote.statusClass}`}>
                  <MaterialSymbol name={lote.statusIcon} filled className="!text-[12px]" />
                  {lote.status}
                </span>
                <span className="text-[10px] text-[var(--ms-on-surface-variant)]">{lote.note}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
