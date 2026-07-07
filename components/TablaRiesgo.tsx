'use client'
import { RiesgoData } from '@/lib/parseData'

export default function TablaRiesgo({ data }: { data: RiesgoData[] }) {
  const sorted = [...data].sort((a, b) => b['Riesgo_%'] - a['Riesgo_%'])

  const badge = (nivel: string) => {
    if (nivel === 'ALTO') return 'bg-red-100 text-red-700 border border-red-200'
    if (nivel === 'MEDIO') return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    if (nivel === 'N/D') return 'bg-gray-100 text-gray-400 border border-gray-200'
    return 'bg-green-100 text-green-700 border border-green-200'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Detalle por cultivo</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Cultivo</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Región</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">Riesgo</th>
              <th className="text-center py-2 px-3 text-gray-500 font-medium">Nivel</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">Prod. media (ton)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-800">{row.Cultivo}</td>
                <td className="py-2 px-3 text-gray-600">{row.Region}</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">
                  {row.Nivel === 'N/D' ? <span className="text-gray-300">—</span> : `${row['Riesgo_%']}%`}
                </td>
                <td className="py-2 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge(row.Nivel)}`}>
                    {row.Nivel}
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {row.Media_historica_ton?.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
