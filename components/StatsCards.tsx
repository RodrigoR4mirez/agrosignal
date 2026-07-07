import { RiesgoData } from '@/lib/parseData'

export default function StatsCards({ data }: { data: RiesgoData[] }) {
  const alto = data.filter(d => d.Nivel === 'ALTO').length
  const medio = data.filter(d => d.Nivel === 'MEDIO').length
  const bajo = data.filter(d => d.Nivel === 'BAJO').length
  const total = data.filter(d => d.Nivel !== 'N/D').length

  const cards = [
    {
      label: 'RIESGO ALTO',
      value: alto,
      sub: `${total} cultivos analizados · >60% riesgo`,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca',
      bar: '#dc2626',
    },
    {
      label: 'RIESGO MEDIO',
      value: medio,
      sub: 'Entre 35% y 60% de riesgo',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      bar: '#f59e0b',
    },
    {
      label: 'RIESGO BAJO',
      value: bajo,
      sub: 'Menos del 35% de riesgo',
      color: '#16a34a',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      bar: '#22c55e',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      {cards.map((card) => (
        <div key={card.label} style={{
          backgroundColor: card.bg,
          border: `1px solid ${card.border}`,
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: card.color, letterSpacing: '0.08em' }}>
            {card.label}
          </span>
          <span style={{ fontSize: '48px', fontWeight: 800, color: card.color, lineHeight: 1 }}>
            {card.value}
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{card.sub}</span>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '3px', backgroundColor: card.bar,
          }} />
        </div>
      ))}
    </div>
  )
}
