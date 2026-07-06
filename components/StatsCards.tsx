import { RiesgoData } from '@/lib/parseData'

export default function StatsCards({ data }: { data: RiesgoData[] }) {
  const alto = data.filter(d => d.Nivel === 'ALTO').length
  const medio = data.filter(d => d.Nivel === 'MEDIO').length
  const bajo = data.filter(d => d.Nivel === 'BAJO').length

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
        <div className="text-4xl font-bold text-red-600">{alto}</div>
        <div className="text-red-700 font-semibold mt-1">Riesgo Alto</div>
        <div className="text-red-400 text-sm">mayor al 60%</div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
        <div className="text-4xl font-bold text-yellow-600">{medio}</div>
        <div className="text-yellow-700 font-semibold mt-1">Riesgo Medio</div>
        <div className="text-yellow-400 text-sm">entre 35% y 60%</div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <div className="text-4xl font-bold text-green-600">{bajo}</div>
        <div className="text-green-700 font-semibold mt-1">Riesgo Bajo</div>
        <div className="text-green-400 text-sm">menor al 35%</div>
      </div>
    </div>
  )
}
