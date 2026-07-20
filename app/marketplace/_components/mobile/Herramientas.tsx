import { MaterialSymbol } from '../shared/MaterialSymbol'

const ITEMS = [
  { icon: 'monitoring', bg: 'bg-[var(--ms-primary)]/10', color: 'text-[var(--ms-primary)]', title: 'Precios en Tiempo Real' },
  { icon: 'wb_sunny', bg: 'bg-[var(--ms-secondary-container)]/20', color: 'text-[var(--ms-secondary)]', title: 'Clima Geo-localizado' },
  { icon: 'warning', bg: 'bg-[var(--ms-tertiary-container)]/20', color: 'text-[var(--ms-tertiary)]', title: 'Alertas de Riesgo' },
  { icon: 'local_shipping', bg: 'bg-[var(--ms-primary)]/10', color: 'text-[var(--ms-primary)]', title: 'Fletes y Logística' },
  { icon: 'description', bg: 'bg-[var(--ms-secondary-container)]/20', color: 'text-[var(--ms-secondary)]', title: 'Créditos Agrarios' },
  { icon: 'groups', bg: 'bg-[var(--ms-tertiary-container)]/20', color: 'text-[var(--ms-tertiary)]', title: 'Comunidad Pro' },
]

export function Herramientas() {
  return (
    <section className="space-y-6 px-6 py-12">
      <div className="text-center">
        <h3 className="text-2xl leading-[32px] font-bold text-[var(--ms-primary)]">Nuestras Herramientas</h3>
        <p className="mt-2 text-sm leading-5 text-[var(--ms-on-surface-variant)]">
          Tecnología de punta al servicio del campo.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="space-y-3 rounded-[1rem] border border-[var(--ms-outline-variant)]/20 bg-[var(--ms-surface-container-low)] p-5"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-[0.5rem] ${item.bg}`}>
              <MaterialSymbol name={item.icon} className={item.color} />
            </div>
            <h4 className="text-sm leading-tight font-semibold">{item.title}</h4>
          </div>
        ))}
      </div>
    </section>
  )
}
