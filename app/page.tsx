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
            <span style={{ fontSize: '28px' }}>🌾</span>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Monitor Agrícola Perú
              </h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                Riesgo de mala cosecha por región y cultivo
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
            Basado en datos climáticos NASA POWER 2015–2025 y producción histórica FAOSTAT
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
            <span>Fuentes:</span>
            <span style={{ fontWeight: 600, color: '#6b7280' }}>NASA POWER</span>
            <span>·</span>
            <span style={{ fontWeight: 600, color: '#6b7280' }}>FAOSTAT</span>
            <span>·</span>
            <span style={{ fontWeight: 600, color: '#6b7280' }}>MINAGRI Perú</span>
          </div>
          <div>Actualizado mensualmente · Modelo Random Forest</div>
        </div>
      </footer>

    </div>
  )
}
