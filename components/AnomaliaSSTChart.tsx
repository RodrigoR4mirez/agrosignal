'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

// Fuente: NOAA Climate Prediction Center, ENSO Diagnostic Discussion, emitido 11 jun 2026
const data = [
  { region: 'Niño 4', anomalia: 0.7, nota: 'Pacífico centro-oeste' },
  { region: 'Niño 3.4', anomalia: 0.7, nota: 'Pacífico central (índice ENSO estándar)' },
  { region: 'Niño 1+2', anomalia: 2.1, nota: 'Frente a la costa peruana' },
]

export default function AnomaliaSSTChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 20, left: 0, right: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="region" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
        <YAxis domain={[0, 2.5]} tickFormatter={v => `+${v}°`} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip formatter={(v, _n, item) => [`+${v} °C`, item.payload.nota]} contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
        <Bar dataKey="anomalia" radius={[4, 4, 0, 0]} maxBarSize={70}>
          <LabelList dataKey="anomalia" position="top" formatter={(v: number) => `+${v}°C`} style={{ fontSize: 12, fontWeight: 700, fill: '#374151' }} />
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.region === 'Niño 1+2' ? '#EF4444' : '#d4a017'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}