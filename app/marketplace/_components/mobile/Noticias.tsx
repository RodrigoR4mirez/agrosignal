import { PlaceholderImage } from '../shared/PlaceholderImage'

const NOTICIAS = [
  { tag: 'MERCADOS', icon: 'trending_up', title: 'Proyecciones de exportación para la campaña 2024.' },
  { tag: 'TECNOLOGÍA', icon: 'sensors', title: 'Nuevos sensores de humedad para suelos áridos.' },
]

export function Noticias() {
  return (
    <section className="space-y-6 px-6 py-8">
      <h3 className="text-center text-2xl leading-[32px] font-bold text-[var(--ms-primary)]">Últimas Noticias</h3>
      <div className="ms-hide-scrollbar flex gap-4 overflow-x-auto">
        {NOTICIAS.map((n) => (
          <div key={n.title} className="w-64 shrink-0 space-y-3">
            <PlaceholderImage icon={n.icon} tone="gold" className="h-40 w-full rounded-[1rem]" />
            <span className="text-xs leading-4 font-bold text-[var(--ms-tertiary)]">{n.tag}</span>
            <h4 className="text-base leading-tight font-semibold">{n.title}</h4>
          </div>
        ))}
      </div>
    </section>
  )
}
