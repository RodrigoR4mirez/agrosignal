'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ErrorBar, ReferenceLine } from 'recharts'
import { ImpactoNinoData } from '@/lib/parseData'

const colorPorImpacto = (impacto: ImpactoNinoData['ImpactoEsperado']) => {
  if (impacto === 'ALTO') return '#EF4444'
  if (impacto === 'MEDIO') return '#F59E0B'
  if (impacto === 'BAJO') return '#9ca3af'
  return '#22C55E'
}

export default function ImpactoNinoChart({ data }: { data: ImpactoNinoData[] }) {
  // Solo cultivos donde los 4 años análogos coinciden en el signo del efecto —
  // el resto es señal mixta y se muestra aparte en la tabla, no acá.
  const confiables = data
    .filter(d => d.Confianza !== 'baja')
    .map(d => ({
      ...d,
      rango: [d.Anomalia_pp - d.AnomaliaMin_pp, d.AnomaliaMax_pp - d.Anomalia_pp] as [number, number],
    }))

  if (confiables.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Ningún cultivo tiene una señal históricamente consistente en los 4 años análogo (2015, 2016, 2017, 2023).
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, confiables.length * 42)}>
      <BarChart data={confiables} layout="vertical" margin={{ top: 10, left: 10, right: 30, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis
          type="number"
          domain={[-70, 70]}
          tickFormatter={v => `${v > 0 ? '+' : ''}${v}pp`}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis type="category" dataKey="Cultivo" width={110} tick={{ fontSize: 13, fill: '#374151' }} axisLine={false} tickLine={false} />
        <ReferenceLine x={0} stroke="#9ca3af" />
        <Tooltip
          formatter={(_v, _n, item) => {
            const d = item.payload as ImpactoNinoData
            const max = d.AnomaliaMax_pp > 0 ? `+${d.AnomaliaMax_pp}` : d.AnomaliaMax_pp
            return [`${d.Anomalia_pp > 0 ? '+' : ''}${d.Anomalia_pp}pp (rango histórico: ${d.AnomaliaMin_pp}pp a ${max}pp)`, 'Anomalía vs. crecimiento normal']
          }}
          contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        />
        <Bar dataKey="Anomalia_pp" radius={[4, 4, 4, 4]} maxBarSize={22}>
          <ErrorBar dataKey="rango" width={4} strokeWidth={1.5} stroke="#374151" />
          {confiables.map((entry, i) => (
            <Cell key={i} fill={colorPorImpacto(entry.ImpactoEsperado)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
