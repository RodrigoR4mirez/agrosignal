'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

// Fuente: ENFEN (SENAMHI/IMARPE), Comunicado Oficial N.º 11-2026 (16 jun 2026)
// El Niño Costero (región Niño 1+2), magnitud prevista para el verano 2026-2027.
// "Otros escenarios" es el complemento a 100% no desglosado en el comunicado.
const data = [
  { escenario: 'Fuerte', probabilidad: 48 },
  { escenario: 'Moderado', probabilidad: 46 },
  { escenario: 'Otros escenarios', probabilidad: 6 },
]

const color = (escenario: string) => {
  if (escenario === 'Fuerte') return '#EF4444'
  if (escenario === 'Moderado') return '#F59E0B'
  return '#9ca3af'
}

export default function MagnitudNinoChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, left: 10, right: 40, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" domain={[0, 60]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
        <YAxis type="category" dataKey="escenario" width={110} tick={{ fontSize: 13, fill: '#374151' }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v) => [`${v}%`, 'Probabilidad']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
        <Bar dataKey="probabilidad" radius={[0, 4, 4, 0]} maxBarSize={32}>
          <LabelList dataKey="probabilidad" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }} />
          {data.map((entry, i) => (
            <Cell key={i} fill={color(entry.escenario)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}