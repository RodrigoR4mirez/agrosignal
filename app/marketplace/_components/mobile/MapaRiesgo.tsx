import { PlaceholderImage } from '../shared/PlaceholderImage'

export function MapaRiesgo() {
  return (
    <section className="px-6 py-8">
      <div className="space-y-6 rounded-[1.5rem] bg-[var(--ms-surface-container)] p-6">
        <div>
          <h3 className="text-2xl leading-[32px] font-bold text-[var(--ms-primary)]">Mapa de Riesgos</h3>
          <p className="text-sm leading-5 text-[var(--ms-on-surface-variant)]">
            Pronóstico de heladas y sequías (Piura - Ica)
          </p>
        </div>
        <div className="relative h-[240px] overflow-hidden rounded-[1rem] bg-white shadow-inner">
          <PlaceholderImage icon="map" tone="primary" className="absolute inset-0 h-full w-full" />
          <div className="absolute right-4 bottom-4 left-4 flex justify-between rounded-[0.75rem] border border-[var(--ms-outline-variant)]/30 bg-white/90 p-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--ms-error)]" />
              <span className="text-[10px] font-bold">Crítico</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--ms-secondary)]" />
              <span className="text-[10px] font-bold">Moderado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[var(--ms-primary)]" />
              <span className="text-[10px] font-bold">Seguro</span>
            </div>
          </div>
        </div>
        <button className="w-full rounded-[0.75rem] border-2 border-[var(--ms-primary)] py-4 font-bold text-[var(--ms-primary)]">
          Analizar mi zona
        </button>
      </div>
    </section>
  )
}
