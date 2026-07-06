'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { RiesgoData } from '@/lib/parseData'

export default function RiesgoChart({ data }: { data: RiesgoData[] }) {
  const sorted = [...data].sort((a, b) => b['Riesgo_%'] - a['Riesgo_%'])

  const getColor = (nivel: string) => {
    if (nivel === 'ALTO') return '#EF4444'
    if (nivel === 'MEDIO') return '#F59E0B'
    return '#22C55E'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Riesgo de mala cosecha por cultivo</h2>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 40 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <YAxis type="category" dataKey="Cultivo" width={110} tick={{ fontSize: 13 }} />
          <Tooltip formatter={(v) => [`${v}%`, 'Riesgo']} />
          <ReferenceLine x={60} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Alto', fill: '#EF4444', fontSize: 11 }} />
          <ReferenceLine x={35} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Medio', fill: '#F59E0B', fontSize: 11 }} />
          <Bar dataKey="Riesgo_%" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, i) => (
              <Cell key={i} fill={getColor(entry.Nivel)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
