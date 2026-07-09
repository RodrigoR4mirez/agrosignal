'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Fuente: IRI (Columbia University) / NOAA CPC — consenso de 24 modelos ENSO, emitido 22 jun 2026
const data = [
  { periodo: 'JJA 2026', probabilidad: 100 },
  { periodo: 'SON 2026', probabilidad: 100 },
  { periodo: 'OND 2026', probabilidad: 99 },
  { periodo: 'DEF 2027', probabilidad: 99 },
  { periodo: 'EFM 2027', probabilidad: 98 },
  { periodo: 'FMA 2027', probabilidad: 97 },
]

export default function ProbabilidadNinoChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, left: 0, right: 20, bottom: 0 }}>
        <defs>
          <linearGradient id="probNino" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a017" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#d4a017" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={44} />
        <Tooltip formatter={(v) => [`${v}%`, 'Probabilidad de El Niño']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
        <Area type="monotone" dataKey="probabilidad" stroke="#d4a017" strokeWidth={2} fill="url(#probNino)" dot={{ r: 3, fill: '#d4a017', strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}