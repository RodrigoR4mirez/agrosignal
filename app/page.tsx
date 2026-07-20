import Link from 'next/link'
import { getRiesgoData } from '@/lib/parseData'
import StatsCards from '@/components/StatsCards'
import RiesgoChart from '@/components/RiesgoChart'
import TablaRiesgo from '@/components/TablaRiesgo'
import Aviso from '@/components/Aviso'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'

export default function Home() {
  const riesgo = getRiesgoData()
  const ahora = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="min-h-screen">

      {/* Header — compacto, la protagonista es la tarjeta verde de abajo */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="app-container px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[var(--brand-green-500)] to-[var(--brand-green-700)] shadow-sm flex items-center justify-center text-sm shrink-0">
              🌾
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-gradient-brand leading-none">
                AgroSignal
              </h1>
              <p className="text-[11px] text-gray-400 tracking-wide hidden sm:block mt-1">
                Anticipa la cosecha, asegura tu negocio
              </p>
            </div>
          </div>
          <div className="text-right shrink-0 leading-tight">
            <div className="text-xs text-gray-400 font-normal">Última actualización</div>
            <div className="text-xs text-gray-600 font-medium mt-0.5">{ahora}</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="app-container px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

        {/* Tagline — foco visual principal de la página */}
        <div className="card-surface relative overflow-hidden bg-linear-to-br from-[var(--brand-green-900)] to-[var(--brand-green-600)] px-8 sm:px-10 py-8 sm:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-[var(--brand-gold-400)]/20 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-[32px] sm:text-4xl font-bold text-white mb-2 leading-tight">
              Monitor de Riesgo Agrícola — Perú {new Date().getFullYear()}
            </h2>
            <p className="text-base font-medium text-emerald-100/85">
              Detecta años con riesgo de mala cosecha antes de que ocurran · 25 regiones · 30 cultivos
            </p>
          </div>
          <div className="relative text-left md:text-right shrink-0">
            <div className="text-xs font-normal text-emerald-100/70 mb-1">Modelo</div>
            <div className="text-sm font-medium text-white">Random Forest · NASA POWER · FAOSTAT</div>
          </div>
        </div>

        {/* Banner: El Niño 2026-2027 — más compacto y menos saturado que el hero */}
        <Link href="/fenomeno-nino" className="group block">
          <div className="card-surface relative overflow-hidden bg-linear-to-r from-[#5c2a1a] to-[#b45309] px-6 sm:px-8 py-4 flex items-center justify-between gap-4 group-hover:shadow-[var(--shadow-card-hover)] group-hover:-translate-y-0.5">
            <div className="relative flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-lg shrink-0">
                🌊
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white mb-1 truncate">
                  Alerta: El Niño 2026–2027 se perfila fuerte
                </h3>
                <p className="text-sm font-normal text-orange-100/80 truncate">
                  63% prob. de evento &quot;muy fuerte&quot; (NOAA CPC) · ENFEN prevé magnitud fuerte en la costa
                </p>
              </div>
            </div>
            <span
              className="relative self-center text-sm font-medium text-white whitespace-nowrap flex items-center gap-1.5 shrink-0 rounded-lg bg-white/10 border border-white/15 pl-4 pr-5 py-2 group-hover:bg-white/15"
              style={{ transition: 'var(--transition-base)' }}
            >
              Ver pronóstico
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </span>
          </div>
        </Link>

        {/* Descargo de responsabilidad */}
        <Aviso
          resumen="AgroSignal es una herramienta experimental de código abierto; los niveles de riesgo son estimaciones estadísticas, no asesoría comercial ni agronómica."
          detalle="Los modelos se entrenan con datos anuales de FAOSTAT (2015 en adelante) y clima satelital NASA POWER de un punto representativo por región. Verifica siempre con fuentes oficiales (MIDAGRI/SENAMHI) antes de tomar decisiones. Los cultivos marcados N/D no cuentan con predicción activa."
        />

        <StatsCards data={riesgo} />

        <Card>
          <CardHeader>
            <CardTitle>Riesgo de mala cosecha por cultivo</CardTitle>
            <CardDescription>
              Modelo entrenado con clima NASA POWER y producción FAOSTAT 2015–2024 · riesgo del año en curso calculado con los últimos 12 meses de clima
            </CardDescription>
          </CardHeader>
          <RiesgoChart data={riesgo} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle por cultivo</CardTitle>
            <CardDescription>
              Región principal de producción y nivel de alerta para el año en curso
            </CardDescription>
          </CardHeader>
          <TablaRiesgo data={riesgo} />
        </Card>

      </main>

      {/* Footer */}
      <footer className="app-container px-4 sm:px-6 lg:px-8 pb-10">
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-[var(--brand-green-600)]">AgroSignal</span>
            <span>·</span>
            <span>NASA POWER</span>
            <span>·</span>
            <span>FAOSTAT</span>
            <span>·</span>
            <span>MINAGRI Perú</span>
          </div>
          <div>Actualizado mensualmente · © {new Date().getFullYear()} AgroSignal</div>
        </div>
      </footer>

    </div>
  )
}
