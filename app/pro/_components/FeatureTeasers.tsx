import { MaterialSymbol } from './shared/MaterialSymbol'

const FEATURES = [
  {
    icon: 'public',
    iconBg: 'bg-[var(--pro-primary)]/5',
    iconColor: 'text-[var(--pro-primary)]',
    title: 'Global Intelligence',
    desc: 'Monitorea precios internacionales y tendencias climáticas globales integradas directamente en tu panel de control local.',
  },
  {
    icon: 'local_shipping',
    iconBg: 'bg-[var(--pro-secondary)]/10',
    iconColor: 'text-[var(--pro-secondary)]',
    title: 'Real-time Logistics',
    desc: 'Gestión de flotas y seguimiento de carga en tiempo real con optimización de rutas mediante IA para reducir costos operativos.',
  },
  {
    icon: 'diversity_3',
    iconBg: 'bg-[var(--pro-primary)]/10',
    iconColor: 'text-[var(--pro-primary)]',
    title: 'Premium Community',
    desc: 'Acceso a red de contactos verificada de alto nivel, foros especializados y eventos exclusivos para miembros PRO del sector.',
  },
]

export function FeatureTeasers() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-[32px] leading-[40px] font-bold text-[var(--pro-primary)]">
          Exclusivo de AgroSignal PRO
        </h2>
        <div className="mx-auto h-1 w-24 rounded-full bg-[var(--pro-secondary)]" />
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {FEATURES.map((f) => (
          <a
            key={f.title}
            href="#lista-espera"
            className="group relative overflow-hidden rounded-[32px] border border-[var(--pro-surface-container)] bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute top-0 right-0 p-6">
              <MaterialSymbol name="lock" className="!text-4xl text-[var(--pro-outline)]/30 transition-colors group-hover:text-[var(--pro-secondary)]/50" />
            </div>
            <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${f.iconBg} ${f.iconColor}`}>
              <MaterialSymbol name={f.icon} className="!text-3xl" />
            </div>
            <h3 className="mb-3 text-xl leading-7 font-semibold text-[var(--pro-on-surface)]">{f.title}</h3>
            <p className="mb-6 text-sm leading-5 text-[var(--pro-on-surface-variant)]">{f.desc}</p>
            <div className="flex items-center gap-2 text-xs leading-4 font-bold text-[var(--pro-secondary)]">
              <span>Descubre más pronto</span>
              <MaterialSymbol name="arrow_forward" className="!text-base" />
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full origin-left scale-x-0 bg-[var(--pro-secondary)] transition-transform group-hover:scale-x-100" />
          </a>
        ))}
      </div>
    </section>
  )
}
