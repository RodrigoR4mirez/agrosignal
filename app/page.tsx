import Link from 'next/link'
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
            {/* Logo placeholder — reemplazar con imagen generada */}
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
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Última actualización</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{ahora}</div>
          </div>
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
          backgroundColor: '#1a5c2a',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
              Monitor de Riesgo Agrícola — Perú {new Date().getFullYear()}
            </h2>
            <p style={{ fontSize: '13px', color: '#86efac', margin: 0 }}>
              Detecta años con riesgo de mala cosecha antes de que ocurran · 25 regiones · 30 cultivos
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#86efac' }}>Modelo</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Random Forest · NASA POWER · FAOSTAT</div>
          </div>
        </div>

        {/* Banner: El Niño 2026-2027 */}
        <Link href="/fenomeno-nino" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: '#7c2d12',
            borderRadius: '16px',
            padding: '18px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            cursor: 'pointer',
          }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 2px 0' }}>
                🌊 Alerta: El Niño 2026–2027 se perfila fuerte
              </h3>
              <p style={{ fontSize: '12.5px', color: '#fed7aa', margin: 0 }}>
                63% de probabilidad de un evento "muy fuerte" (NOAA CPC) · ENFEN prevé magnitud fuerte en la costa peruana
              </p>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
              Ver pronóstico climático →
            </span>
          </div>
        </Link>

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
          <strong>Aviso:</strong> AgroSignal es una herramienta experimental de código abierto.
          Los niveles de riesgo son estimaciones estadísticas basadas en modelos entrenados con
          datos anuales de FAOSTAT (2015 en adelante) y clima satelital NASA POWER de un punto
          representativo por región. No constituyen asesoría comercial, financiera ni agronómica;
          verifica siempre con fuentes oficiales (MIDAGRI/SENAMHI) antes de tomar decisiones.
          Los cultivos marcados N/D no cuentan con predicción activa.
        </div>

        <StatsCards data={riesgo} />

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '28px 32px',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Riesgo de mala cosecha por cultivo
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
            Modelo entrenado con clima NASA POWER y producción FAOSTAT 2015–2024 · riesgo del año en curso calculado con los últimos 12 meses de clima
          </p>
          <RiesgoChart data={riesgo} />
        </div>

        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          padding: '28px 32px',
        }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Detalle por cultivo
          </h2>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
            Región principal de producción y nivel de alerta para el año en curso
          </p>
          <TablaRiesgo data={riesgo} />
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
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#9ca3af',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontWeight: 700, color: '#1a5c2a' }}>AgroSignal</span>
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
