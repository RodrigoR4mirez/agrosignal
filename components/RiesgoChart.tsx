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

  // El dominio del eje se ajusta al máximo real (+5%) en vez de fijarlo en 100%,
  // así el gráfico usa todo el ancho disponible sin espacio muerto a la derecha.
  const maxRiesgo = Math.max(...sorted.map(d => d['Riesgo_%']))
  const domainMax = Math.ceil((maxRiesgo * 1.05) / 10) * 10
  const ticks = Array.from({ length: domainMax / 10 + 1 }, (_, i) => i * 10)

  return (
    <ResponsiveContainer width="100%" height={Math.max(420, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" barCategoryGap="28%" margin={{ left: 0, right: 24, top: 28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef0ea" />
        <XAxis
          type="number"
          domain={[0, domainMax]}
          ticks={ticks}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 13, fill: '#9ca3af' }}
          axisLine={{ stroke: '#eef0ea' }}
          tickLine={false}
        />
        <YAxis type="category" dataKey="Cultivo" width={116} tick={{ fontSize: 15, fill: '#374151' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${v}%`, 'Riesgo']} contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
        {domainMax > 35 && (
          <ReferenceLine
            x={35}
            stroke="#F59E0B"
            strokeOpacity={0.4}
            strokeDasharray="4 4"
            label={{ value: 'Medio', position: 'top', fill: '#b45309', fontSize: 12, fontWeight: 600 }}
          />
        )}
        {domainMax > 60 && (
          <ReferenceLine
            x={60}
            stroke="#EF4444"
            strokeOpacity={0.4}
            strokeDasharray="4 4"
            label={{ value: 'Alto', position: 'top', fill: '#b91c1c', fontSize: 12, fontWeight: 600 }}
          />
        )}
        <Bar dataKey="Riesgo_%" radius={[0, 6, 6, 0]} maxBarSize={32}>
          {sorted.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.Nivel)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
