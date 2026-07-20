'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { RiesgoData } from '@/lib/parseData'

export default function RiesgoChart({ data }: { data: RiesgoData[] }) {
  const sorted = [...data]
    .filter(d => d['Riesgo_%'] > 0)
    .sort((a, b) => b['Riesgo_%'] - a['Riesgo_%'])

  const getColor = (nivel: string) => {
    if (nivel === 'ALTO') return '#EF4444'
    if (nivel === 'MEDIO') return '#F59E0B'
    return '#22C55E'
  }

  // Dominio: termina exactamente 5% por encima del valor máximo para que las
  // barras ocupen ~95% del ancho útil, sin espacio muerto a la derecha.
  const maxRiesgo = Math.max(...sorted.map(d => d['Riesgo_%']))
  const domainMax = Math.round(maxRiesgo * 1.05)
  const ticks = Array.from({ length: Math.floor(domainMax / 10) + 1 }, (_, i) => i * 10)

  return (
    <div className="pl-1 pr-2 pt-2 pb-1">
      <ResponsiveContainer width="100%" height={Math.max(440, sorted.length * 44)}>
        <BarChart
          data={sorted}
          layout="vertical"
          barCategoryGap="32%"
          margin={{ left: 0, right: 8, top: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0ea" />
          <XAxis
            type="number"
            domain={[0, domainMax]}
            ticks={ticks}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 400 }}
            axisLine={{ stroke: '#eef0ea' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="Cultivo"
            width={112}
            tick={{ fontSize: 14, fill: '#374151', fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            formatter={(v) => [`${v}%`, 'Riesgo']}
            contentStyle={{ borderRadius: 'var(--radius-card)', border: '1px solid #e5e7eb', fontSize: '13px', boxShadow: 'var(--shadow-card)' }}
          />
          {domainMax > 35 && (
            <ReferenceLine
              x={35}
              stroke="#F59E0B"
              strokeOpacity={0.3}
              strokeDasharray="4 4"
              label={{ value: 'Medio', position: 'top', fill: '#b45309', fontSize: 10, fontWeight: 500, opacity: 0.75 }}
            />
          )}
          {domainMax > 60 && (
            <ReferenceLine
              x={60}
              stroke="#EF4444"
              strokeOpacity={0.3}
              strokeDasharray="4 4"
              label={{ value: 'Alto', position: 'top', fill: '#b91c1c', fontSize: 10, fontWeight: 500, opacity: 0.75 }}
            />
          )}
          <Bar dataKey="Riesgo_%" radius={[0, 6, 6, 0]} maxBarSize={36}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.Nivel)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
