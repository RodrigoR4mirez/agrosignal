import Link from 'next/link'
import type { Metadata } from 'next'
import ProbabilidadNinoChart from '@/components/ProbabilidadNinoChart'
import AnomaliaSSTChart from '@/components/AnomaliaSSTChart'
import MagnitudNinoChart from '@/components/MagnitudNinoChart'

export const metadata: Metadata = {
  title: 'El Niño 2026–2027 — AgroSignal',
  description: 'Pronóstico internacional del fenómeno El Niño para 2026–2027: probabilidades NOAA CPC, IRI Columbia y ENFEN Perú.',
}

const statCards = [
  {
    label: 'PROBABILIDAD EL NIÑO (JUN–AGO 2026)',
    value: '100%',
    sub: 'Consenso de 24 modelos ENSO — IRI / NOAA CPC',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    bar: '#d4a017',
  },
  {
    label: 'PROB. EVENTO "MUY FUERTE" (NOV 2026–ENE 2027)',
    value: '63%',
    sub: 'Podría ubicarse entre los más intensos desde 1950 — NOAA CPC',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    bar: '#EF4444',
  },
  {
    label: 'ANOMALÍA ACTUAL NIÑO 1+2 (COSTA PERÚ)',
    value: '+2.1 °C',
    sub: 'Al 11 jun 2026 — la región más cercana a Perú ya muestra calentamiento fuerte',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    bar: '#EF4444',
  },
  {
    label: 'MAGNITUD MÁS PROBABLE EN PERÚ (VERANO 26–27)',
    value: 'Fuerte',
    sub: '48% fuerte vs. 46% moderado — ENFEN Comunicado N.º 11-2026',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    bar: '#F59E0B',
  },
]

export default function FenomenoNino() {
  const ahora = new Date().toLocaleDateString('es-PE', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7f2' }}>

      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        width: '100%',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px',
              backgroundColor: '#1a5c2a',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px'
            }}>🌾</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1a5c2a', margin: 0, letterSpacing: '-0.5px' }}>
                  Agro
                </h1>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#d4a017', margin: 0, letterSpacing: '-0.5px' }}>
                  Signal
                </h1>
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, letterSpacing: '0.02em' }}>
                Anticipa la cosecha, asegura tu negocio
              </p>
            </div>
          </div>
          <Link href="/" style={{
            fontSize: '13px', fontWeight: 600, color: '#1a5c2a',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ← Volver al dashboard
          </Link>
        </div>
      </header>

      {/* Main */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>

        {/* Tagline */}
        <div style={{
          backgroundColor: '#7c2d12',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
              🌊 El Niño 2026–2027: pronóstico climático internacional
            </h2>
            <p style={{ fontSize: '13px', color: '#fed7aa', margin: 0 }}>
              Contexto para anticipar impactos en clima y cosechas · fuentes: NOAA CPC · IRI Columbia · ENFEN Perú
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#fed7aa' }}>Última revisión de fuentes</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{ahora}</div>
          </div>
        </div>

        {/* Descargo de responsabilidad */}
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '14px 20px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: 1.6,
        }}>
          <strong>Aviso:</strong> Esta página resume públicamente pronósticos oficiales de
          organismos climáticos internacionales (NOAA CPC, IRI Columbia University) y peruanos
          (ENFEN — SENAMHI/IMARPE). Es información de contexto climático, distinta del modelo
          de riesgo por cultivo de AgroSignal (que usa datos históricos FAOSTAT + NASA POWER).
          Los pronósticos ENSO se actualizan mensualmente y pueden cambiar; verifica siempre
          los comunicados oficiales antes de tomar decisiones productivas o financieras.
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {statCards.map((card) => (
            <div key={card.label} style={{
              backgroundColor: card.bg,
              border: `1px solid ${card.border}`,
              borderRadius: '16px',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: card.color, letterSpacing: '0.06em' }}>
                {card.label}
              </span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: card.color, lineHeight: 1 }}>
                {card.value}
              </span>
              <span style={{ fontSize: '11.5px', color: '#6b7280', lineHeight: 1.4 }}>{card.sub}</span>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: '3px', backgroundColor: card.bar,
              }} />
            </div>
          ))}
        </div>

        {/* Chart: evolución de probabilidad */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '28px 32px',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Evolución de la probabilidad de El Niño (Pacífico central, Niño 3.4)
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
            Consenso de 24 modelos (15 dinámicos, 9 estadísticos) · IRI Columbia University / NOAA CPC, emitido 22 jun 2026
          </p>
          <ProbabilidadNinoChart />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Chart: anomalías SST actuales */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            padding: '28px 32px',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
              Anomalías de temperatura oceánica actuales
            </h2>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
              Respecto al promedio histórico, por región del Pacífico · NOAA CPC, emitido 11 jun 2026
            </p>
            <AnomaliaSSTChart />
          </div>

          {/* Chart: magnitud en Perú */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            padding: '28px 32px',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
              Magnitud de El Niño Costero en Perú — verano 2026–2027
            </h2>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
              Región Niño 1+2 (frente a la costa peruana) · ENFEN, Comunicado Oficial N.º 11-2026 (16 jun 2026)
            </p>
            <MagnitudNinoChart />
          </div>
        </div>

        {/* Notas de contexto */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '28px 32px',
          fontSize: '13px',
          color: '#374151',
          lineHeight: 1.7,
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 12px 0' }}>
            ¿Qué significa esto para el agro peruano?
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              El Niño Costero (el que más afecta directamente al Perú) está activo desde marzo de 2026
              y ENFEN prevé que se extienda hasta el verano de 2027, con mayor probabilidad de magnitud
              <strong> fuerte entre junio y septiembre</strong>, bajando a moderada hacia fin de año.
            </li>
            <li>
              A nivel internacional, NOAA CPC ubica en <strong>63% la probabilidad de un evento "muy fuerte"</strong> entre
              noviembre 2026 y enero 2027 — de concretarse, estaría entre los más intensos desde 1950,
              comparable a 1997–98 o 2015–16.
            </li>
            <li>
              Un El Niño fuerte suele traer lluvias intensas y anomalías cálidas en la costa norte
              (afecta Piura, Lambayeque, La Libertad) y puede alterar la disponibilidad hídrica en la sierra.
              El modelo de riesgo de AgroSignal en la página principal usa clima de los últimos 12 meses,
              por lo que ya captura parte de esta señal — pero no proyecta explícitamente escenarios ENSO futuros.
            </li>
            <li>
              Esta información es contexto climático regional, no un pronóstico por cultivo. Para decisiones
              productivas, cruza esta señal con los comunicados actualizados de{' '}
              <a href="https://enfen.imarpe.gob.pe/comunicados/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c2a' }}>ENFEN</a>{' '}
              y{' '}
              <a href="https://www.senamhi.gob.pe" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c2a' }}>SENAMHI</a>.
            </li>
          </ul>
        </div>

      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 40px 32px',
      }}>
        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '12px',
          color: '#9ca3af',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <strong style={{ color: '#374151' }}>Fuentes:</strong>
            <a href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c2a' }}>
              NOAA CPC — ENSO Diagnostic Discussion (11 jun 2026)
            </a>
            <span>·</span>
            <a href="https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c2a' }}>
              IRI Columbia University — ENSO Forecast (22 jun 2026)
            </a>
            <span>·</span>
            <a href="https://enfen.imarpe.gob.pe/comunicados/" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c2a' }}>
              ENFEN — Comunicado Oficial N.º 11-2026 (16 jun 2026)
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 700, color: '#1a5c2a' }}>AgroSignal</span>
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