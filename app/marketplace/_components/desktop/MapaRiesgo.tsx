import { MaterialSymbol } from '../shared/MaterialSymbol'
import { ProBadge } from '../shared/ProBadge'

const ALERTS = [
  {
    icon: 'warning',
    iconColor: 'text-[var(--ms-error)]',
    label: 'Piura: Riesgo de Lluvia Extrema',
    badge: 'Alto',
    badgeClass: 'bg-[var(--ms-error)] text-white',
  },
  {
    icon: 'error',
    iconColor: 'text-[var(--ms-secondary)]',
    label: 'Ica: Estrés Hídrico Moderado',
    badge: 'MEDIO',
    badgeClass: 'bg-[var(--ms-secondary-container)] text-[var(--ms-on-secondary-container)]',
  },
  {
    icon: 'check_circle',
    iconColor: 'text-[var(--ms-primary)]',
    label: 'Arequipa: Condiciones Óptimas',
    badge: 'Bajo',
    badgeClass: 'bg-[var(--ms-primary-container)] text-white',
  },
]

export function MapaRiesgo() {
  return (
    <section className="relative bg-[var(--ms-surface-container)] py-24">
      <div className="ms-container relative z-10 grid items-center gap-16 px-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-6 flex items-center text-4xl leading-tight font-extrabold text-[var(--ms-primary)]">
            Mapa de Riesgo Agrometeorológico
            <MaterialSymbol name="lock" className="ml-2 !text-3xl text-[var(--ms-gold-accent)]" />
          </h2>
          <p className="mb-8 text-lg text-[var(--ms-on-surface-variant)]">
            Utilizamos imágenes satelitales y modelos predictivos para alertarte sobre heladas, sequías o excesos de
            lluvia antes de que afecten tu inversión.
          </p>
          <div className="mb-10 space-y-4">
            {ALERTS.map((alert) => (
              <div
                key={alert.label}
                className="flex items-center gap-4 rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white p-4 shadow-sm"
              >
                <MaterialSymbol name={alert.icon} filled className={alert.iconColor} />
                <span className="flex-1 font-bold">{alert.label}</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black tracking-wider uppercase ${alert.badgeClass}`}>
                  {alert.badge}
                </span>
              </div>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-[1rem] bg-[var(--ms-primary)] px-8 py-4 font-bold text-white transition-all hover:scale-[1.03]">
            <MaterialSymbol name="distance" />
            <ProBadge />
            Ver el riesgo de mi cultivo
          </button>
        </div>
        <div className="relative min-h-[500px] overflow-hidden rounded-[1.5rem] bg-white p-4 shadow-2xl">
          <div className="absolute inset-4 flex items-center justify-center overflow-hidden rounded-[1rem] border-2 border-[var(--ms-outline-variant)] bg-[var(--ms-surface)]">
            <img src="/marketplace/mapa-riesgo-topografico.jpg" alt="Mapa topográfico de zonas agrícolas del Perú" className="h-full w-full object-cover" />
            <div className="ms-glass-card absolute top-4 left-4 flex items-center gap-2 rounded-[0.5rem] p-3">
              <MaterialSymbol name="satellite_alt" className="text-[var(--ms-primary)]" />
              <span className="text-xs font-bold uppercase">Vista Satelital Activa</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-[0.5rem] bg-[var(--ms-gold-accent)] px-3 py-1.5 shadow-lg">
            <MaterialSymbol name="lock" className="!text-sm text-white" />
            <span className="text-[10px] font-bold tracking-widest text-white">PRO</span>
          </div>
        </div>
      </div>
    </section>
  )
}
