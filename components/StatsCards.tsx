import { RiesgoData } from '@/lib/parseData'

export default function StatsCards({ data }: { data: RiesgoData[] }) {
  const alto = data.filter(d => d.Nivel === 'ALTO').length
  const medio = data.filter(d => d.Nivel === 'MEDIO').length
  const bajo = data.filter(d => d.Nivel === 'BAJO').length
  const total = data.filter(d => d.Nivel !== 'N/D').length

  const cards = [
    {
      label: 'Riesgo alto',
      value: alto,
      sub: `${total} cultivos analizados · >60% riesgo`,
      text: 'text-red-700',
      accent: 'bg-red-400',
    },
    {
      label: 'Riesgo medio',
      value: medio,
      sub: 'Entre 35% y 60% de riesgo',
      text: 'text-amber-700',
      accent: 'bg-amber-400',
    },
    {
      label: 'Riesgo bajo',
      value: bajo,
      sub: 'Menos del 35% de riesgo',
      text: 'text-emerald-700',
      accent: 'bg-emerald-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="card-surface card-surface-hover relative overflow-hidden border border-gray-100 bg-white pl-7 pr-6 py-4 flex flex-col items-start justify-center gap-1"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-2 ${card.accent}`} />
          <span className={`text-sm font-medium ${card.text}`}>{card.label}</span>
          <span className={`text-[64px] font-bold tabular-nums leading-none ${card.text}`}>
            {card.value}
          </span>
          <span className="text-sm font-normal text-gray-500 leading-snug">{card.sub}</span>
        </div>
      ))}
    </div>
  )
}
