'use client'
import { ImpactoNinoData } from '@/lib/parseData'

const badgeImpacto = (impacto: ImpactoNinoData['ImpactoEsperado']) => {
  if (impacto === 'ALTO') return 'bg-red-100 text-red-700 border border-red-200'
  if (impacto === 'MEDIO') return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
  if (impacto === 'BAJO') return 'bg-gray-100 text-gray-600 border border-gray-200'
  return 'bg-green-100 text-green-700 border border-green-200'
}

const badgeConfianza = (confianza: ImpactoNinoData['Confianza']) => {
  if (confianza === 'alta') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  if (confianza === 'media') return 'bg-amber-100 text-amber-700 border border-amber-200'
  return 'bg-gray-100 text-gray-400 border border-gray-200'
}

export default function ImpactoNinoTabla({ data }: { data: ImpactoNinoData[] }) {
  const sorted = [...data].sort((a, b) => a.Anomalia_pp - b.Anomalia_pp)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 text-gray-500 font-medium">Cultivo</th>
            <th className="text-left py-3 px-4 text-gray-500 font-medium">Región</th>
            <th className="text-right py-3 px-4 text-gray-500 font-medium">Anomalía prom.</th>
            <th className="text-right py-3 px-4 text-gray-500 font-medium">Rango histórico</th>
            <th className="text-center py-3 px-4 text-gray-500 font-medium">Impacto esperado</th>
            <th className="text-center py-3 px-4 text-gray-500 font-medium">Confianza</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className={`border-b border-gray-50 hover:bg-[var(--surface)] transition-colors ${row.Confianza === 'baja' ? 'opacity-50' : ''}`}>
              <td className="py-3 px-4 font-medium text-gray-800">{row.Cultivo}</td>
              <td className="py-3 px-4 text-gray-600">{row.Region}</td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-gray-800">
                {row.Anomalia_pp > 0 ? '+' : ''}{row.Anomalia_pp}pp
              </td>
              <td className="py-3 px-4 text-right font-mono text-gray-500 text-xs">
                {row.AnomaliaMin_pp}pp a {row.AnomaliaMax_pp > 0 ? '+' : ''}{row.AnomaliaMax_pp}pp
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeImpacto(row.ImpactoEsperado)}`}>
                  {row.ImpactoEsperado.replace('_', ' ')}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeConfianza(row.Confianza)}`}>
                  {row.Confianza}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
