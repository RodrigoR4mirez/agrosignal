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
      icon: '🔴',
      text: 'text-red-700',
      accent: 'bg-red-400',
    },
    {
      label: 'Riesgo medio',
      value: medio,
      sub: 'Entre 35% y 60% de riesgo',
      icon: '🟡',
      text: 'text-amber-700',
      accent: 'bg-amber-400',
    },
    {
      label: 'Riesgo bajo',
      value: bajo,
      sub: 'Menos del 35% de riesgo',
      icon: '🟢',
      text: 'text-emerald-700',
      accent: 'bg-emerald-400',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white pl-7 pr-6 py-6 flex flex-col justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(0,0,0,0.12)] transition-shadow duration-200"
        >
          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.accent}`} />
          <div className="flex items-center gap-2">
            <span className="text-xs">{card.icon}</span>
            <span className={`text-sm font-semibold ${card.text}`}>{card.label}</span>
          </div>
          <span className={`text-6xl font-extrabold tabular-nums leading-none ${card.text}`}>
            {card.value}
          </span>
          <span className="text-sm text-gray-500 leading-snug">{card.sub}</span>
        </div>
      ))}
    </div>
  )
}
