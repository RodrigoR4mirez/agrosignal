import Link from 'next/link'
import type { Metadata } from 'next'
import ProbabilidadNinoChart from '@/components/ProbabilidadNinoChart'
import AnomaliaSSTChart from '@/components/AnomaliaSSTChart'
import MagnitudNinoChart from '@/components/MagnitudNinoChart'
import ImpactoNinoChart from '@/components/ImpactoNinoChart'
import ImpactoNinoTabla from '@/components/ImpactoNinoTabla'
import { getImpactoNinoData } from '@/lib/parseData'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import Aviso from '@/components/Aviso'

export const metadata: Metadata = {
  title: 'El Niño 2026–2027 — AgroSignal',
  description: 'Pronóstico internacional del fenómeno El Niño para 2026–2027: probabilidades NOAA CPC, IRI Columbia y ENFEN Perú.',
}

const statCards = [
  {
    label: 'PROBABILIDAD EL NIÑO (JUN–AGO 2026)',
    value: '100%',
    sub: 'Consenso de 24 modelos ENSO — IRI / NOAA CPC',
    tone: 'amber',
  },
  {
    label: 'PROB. EVENTO "MUY FUERTE" (NOV 2026–ENE 2027)',
    value: '63%',
    sub: 'Podría ubicarse entre los más intensos desde 1950 — NOAA CPC',
    tone: 'red',
  },
  {
    label: 'ANOMALÍA ACTUAL NIÑO 1+2 (COSTA PERÚ)',
    value: '+2.1 °C',
    sub: 'Al 11 jun 2026 — la región más cercana a Perú ya muestra calentamiento fuerte',
    tone: 'red',
  },
  {
    label: 'MAGNITUD MÁS PROBABLE EN PERÚ (VERANO 26–27)',
    value: 'Fuerte',
    sub: '48% fuerte vs. 46% moderado — ENFEN Comunicado N.º 11-2026',
    tone: 'amber',
  },
] as const

const tones = {
  amber: { text: 'text-amber-700', accent: 'bg-amber-400' },
  red: { text: 'text-red-700', accent: 'bg-red-400' },
}

export default function FenomenoNino() {
  const ahora = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
  const impacto = getImpactoNinoData()
  const confiables = impacto.filter(d => d.Confianza !== 'baja').length

  return (
    <div className="min-h-screen">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="app-container px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[var(--brand-green-500)] to-[var(--brand-green-700)] shadow-sm flex items-center justify-center text-sm shrink-0">
              🌾
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-gradient-brand leading-none">
                AgroSignal
              </h1>
              <p className="text-[11px] text-gray-400 tracking-wide hidden sm:block mt-0.5">
                Anticipa la cosecha, asegura tu negocio
              </p>
            </div>
          </div>
          <Link href="/" className="text-xs font-semibold text-[var(--brand-green-600)] hover:text-[var(--brand-green-700)] transition-colors flex items-center gap-1.5 shrink-0">
            ← Volver al dashboard
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="app-container px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Tagline */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#4a1d10] to-[#c2410c] px-8 sm:px-10 py-9 sm:py-11 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg shadow-orange-900/15">
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-sky-400/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <h2 className="text-[32px] sm:text-4xl font-bold text-white mb-3 leading-tight">
              🌊 El Niño 2026–2027: pronóstico climático internacional
            </h2>
            <p className="text-base text-orange-100/85">
              Contexto para anticipar impactos en clima y cosechas · fuentes: NOAA CPC · IRI Columbia · ENFEN Perú
            </p>
          </div>
          <div className="relative text-left md:text-right shrink-0">
            <div className="text-xs text-orange-100/70 mb-1">Última revisión de fuentes</div>
            <div className="text-sm font-semibold text-white">{ahora}</div>
          </div>
        </div>

        {/* Descargo de responsabilidad */}
        <Aviso
          resumen="Esta página resume pronósticos oficiales de NOAA CPC, IRI Columbia University y ENFEN (SENAMHI/IMARPE); es contexto climático, distinto del modelo de riesgo por cultivo."
          detalle="Los pronósticos ENSO se actualizan mensualmente y pueden cambiar. Verifica siempre los comunicados oficiales antes de tomar decisiones productivas o financieras. El modelo de riesgo por cultivo de AgroSignal usa datos históricos FAOSTAT + NASA POWER y es independiente de estos pronósticos ENSO."
        />

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const t = tones[card.tone]
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white pl-7 pr-6 py-6 flex flex-col justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_16px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-8px_rgba(0,0,0,0.12)] transition-shadow duration-200"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${t.accent}`} />
                <span className={`text-sm font-semibold ${t.text}`}>{card.label}</span>
                <span className={`text-4xl font-extrabold tabular-nums leading-none ${t.text}`}>{card.value}</span>
                <span className="text-sm text-gray-500 leading-snug">{card.sub}</span>
              </div>
            )
          })}
        </div>

        {/* Chart: evolución de probabilidad */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de la probabilidad de El Niño (Pacífico central, Niño 3.4)</CardTitle>
            <CardDescription>
              Consenso de 24 modelos (15 dinámicos, 9 estadísticos) · IRI Columbia University / NOAA CPC, emitido 22 jun 2026
            </CardDescription>
          </CardHeader>
          <ProbabilidadNinoChart />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Chart: anomalías SST actuales */}
          <Card>
            <CardHeader>
              <CardTitle>Anomalías de temperatura oceánica actuales</CardTitle>
              <CardDescription>
                Respecto al promedio histórico, por región del Pacífico · NOAA CPC, emitido 11 jun 2026
              </CardDescription>
            </CardHeader>
            <AnomaliaSSTChart />
          </Card>

          {/* Chart: magnitud en Perú */}
          <Card>
            <CardHeader>
              <CardTitle>Magnitud de El Niño Costero en Perú — verano 2026–2027</CardTitle>
              <CardDescription>
                Región Niño 1+2 (frente a la costa peruana) · ENFEN, Comunicado Oficial N.º 11-2026 (16 jun 2026)
              </CardDescription>
            </CardHeader>
            <MagnitudNinoChart />
          </Card>
        </div>

        {/* Notas de contexto */}
        <Card className="text-[13px] text-gray-700 leading-relaxed">
          <CardHeader>
            <CardTitle>¿Qué significa esto para el agro peruano?</CardTitle>
          </CardHeader>
          <ul className="flex flex-col gap-4">
            {[
              <>
                El Niño Costero (el que más afecta directamente al Perú) está activo desde marzo de 2026
                y ENFEN prevé que se extienda hasta el verano de 2027, con mayor probabilidad de magnitud{' '}
                <strong>fuerte entre junio y septiembre</strong>, bajando a moderada hacia fin de año.
              </>,
              <>
                A nivel internacional, NOAA CPC ubica en <strong>63% la probabilidad de un evento &quot;muy fuerte&quot;</strong> entre
                noviembre 2026 y enero 2027 — de concretarse, estaría entre los más intensos desde 1950,
                comparable a 1997–98 o 2015–16.
              </>,
              <>
                Un El Niño fuerte suele traer lluvias intensas y anomalías cálidas en la costa norte
                (afecta Piura, Lambayeque, La Libertad) y puede alterar la disponibilidad hídrica en la sierra.
                El modelo de riesgo de AgroSignal en la página principal usa clima de los últimos 12 meses,
                por lo que ya captura parte de esta señal — pero no proyecta explícitamente escenarios ENSO futuros.
              </>,
              <>
                Esta información es contexto climático regional, no un pronóstico por cultivo. Para decisiones
                productivas, cruza esta señal con los comunicados actualizados de{' '}
                <a href="https://enfen.imarpe.gob.pe/comunicados/" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-green-600)] font-medium hover:underline">ENFEN</a>{' '}
                y{' '}
                <a href="https://www.senamhi.gob.pe" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-green-600)] font-medium hover:underline">SENAMHI</a>.
              </>,
            ].map((item, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--brand-gold-500)] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Impacto estimado por cultivo */}
        <Card>
          <CardHeader>
            <CardTitle>Impacto estimado por cultivo (análogo histórico)</CardTitle>
            <CardDescription>
              Cuánto se desvió el crecimiento de producción de cada cultivo en años con El Niño
              documentado en Perú (2015, 2016, 2017, 2023), frente a su crecimiento normal en años
              neutros · fuente: FAOSTAT vía <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded">produccion_peru_30cultivos_historico.csv</code>
            </CardDescription>
          </CardHeader>

          <div className="mb-8">
            <Aviso
              tone="red"
              resumen="Esto NO es un pronóstico ni sale del modelo Random Forest de AgroSignal — es una comparación histórica con solo 4 años análogos (2015, 2016, 2017, 2023), una muestra pequeña."
              detalle={'Por eso cada cultivo tiene una etiqueta de confianza: "alta" significa que los 4 años análogos coincidieron en la dirección del efecto (todos negativos o todos positivos); "baja" significa que esos años se contradicen entre sí — no hay un patrón repetido, lo cual NO significa que el cultivo esté a salvo, solo que la evidencia histórica disponible no es concluyente para él. Verifica siempre con INIA, MIDAGRI o tu propia experiencia de campo antes de decidir.'}
            />
          </div>

          <h3 className="text-sm font-bold text-gray-900 mb-1.5">
            Señales con evidencia histórica consistente ({confiables} de {impacto.length} cultivos)
          </h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            La barra es el promedio; la línea es el rango real observado entre los 4 años análogos (en puntos porcentuales sobre el crecimiento normal del cultivo)
          </p>
          <ImpactoNinoChart data={impacto} />

          <h3 className="text-sm font-bold text-gray-900 mt-8 mb-1.5">
            Los {impacto.length} cultivos con serie de producción FAOSTAT
          </h3>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Filas atenuadas = confianza baja (señal mixta, tratar como sin evidencia, no como &quot;impacto cero&quot;)
          </p>
          <ImpactoNinoTabla data={impacto} />

          <p className="text-xs text-gray-400 mt-6 leading-relaxed">
            Sin datos suficientes para estimar (sin serie de producción FAOSTAT comparable):
            Aceituna, Papaya. Los 16 cultivos con solo perfil climático NASA POWER (Granadilla,
            Maracuyá, Chirimoya, Lúcuma, Tara, Sacha inchi, Kiwicha, Cañihua, Olluco, Mashua,
            Yacón, Cúrcuma, Camu camu, Aguaje, Cocona, Achiote) tampoco tienen serie de producción,
            por lo que no es posible calcular un % de impacto para ellos.
          </p>
        </Card>

      </main>

      {/* Footer */}
      <footer className="app-container px-4 sm:px-6 lg:px-8 pb-10">
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-3 text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="text-gray-600">Fuentes:</strong>
            <a href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-green-600)] hover:underline">
              NOAA CPC — ENSO Diagnostic Discussion (11 jun 2026)
            </a>
            <span>·</span>
            <a href="https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-green-600)] hover:underline">
              IRI Columbia University — ENSO Forecast (22 jun 2026)
            </a>
            <span>·</span>
            <a href="https://enfen.imarpe.gob.pe/comunicados/" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-green-600)] hover:underline">
              ENFEN — Comunicado Oficial N.º 11-2026 (16 jun 2026)
            </a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--brand-green-600)]">AgroSignal</span>
              <span>·</span>
              <span>Contexto climático, no reemplaza comunicados oficiales</span>
            </div>
            <div>© {new Date().getFullYear()} AgroSignal</div>
          </div>
        </div>
      </footer>

    </div>
  )
}
