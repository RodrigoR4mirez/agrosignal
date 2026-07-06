import { getRiesgoData } from '@/lib/parseData'
import StatsCards from '@/components/StatsCards'
import RiesgoChart from '@/components/RiesgoChart'
import TablaRiesgo from '@/components/TablaRiesgo'

export default function Home() {
  const riesgo = getRiesgoData()
  const ahora = new Date().toLocaleDateString('es-PE', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🌾</span>
            <h1 className="text-2xl font-bold text-gray-900">
              Monitor de Riesgo Agrícola — Perú
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Detección de riesgo de mala cosecha basada en datos climáticos · Actualizado: {ahora}
          </p>
        </div>

        {/* Tarjetas */}
        <StatsCards data={riesgo} />

        {/* Gráfico */}
        <RiesgoChart data={riesgo} />

        {/* Tabla */}
        <TablaRiesgo data={riesgo} />

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Fuentes: NASA POWER · FAOSTAT · Datos actualizados mensualmente
        </div>
      </div>
    </main>
  )
}
