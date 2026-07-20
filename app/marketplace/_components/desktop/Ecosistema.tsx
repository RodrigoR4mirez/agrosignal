import { MaterialSymbol } from '../shared/MaterialSymbol'
import { ProBadge } from '../shared/ProBadge'

const ITEMS = [
  {
    icon: 'sell',
    title: 'Venta Anticipada',
    pro: false,
    desc: 'Asegura contratos antes de la cosecha. Mitiga riesgos de volatilidad de precios en mercado local.',
  },
  {
    icon: 'local_shipping',
    title: 'Transporte Dedicado',
    pro: true,
    desc: 'Flota certificada con seguimiento GPS y monitoreo de temperatura para perecederos.',
  },
  {
    icon: 'share_location',
    title: 'Carga Compartida',
    pro: false,
    desc: 'Divide costos de flete con otros productores de tu zona. Ahorra hasta un 40% en logística.',
  },
  {
    icon: 'public',
    title: 'Exportación Directa',
    pro: true,
    desc: 'Conectamos tu lote con compradores globales. Gestión documental y aduanera simplificada.',
  },
  {
    icon: 'psychology',
    title: 'Asesoría Agronómica',
    pro: false,
    desc: 'Consultoría técnica vía remota para mejorar el rendimiento de tus cultivos y calidad.',
  },
  {
    icon: 'groups',
    title: 'Comunidad Agro',
    pro: true,
    desc: 'Foros de discusión, alertas de plagas comunitarias y red de confianza de agricultores.',
  },
]

export function Ecosistema() {
  return (
    <section className="ms-container relative px-6 py-24">
      <div className="relative z-10 mb-16 text-center">
        <h2 className="mb-4 text-4xl font-extrabold text-[var(--ms-primary)]">Ecosistema Integral</h2>
        <p className="mx-auto max-w-2xl text-[var(--ms-on-surface-variant)]">
          Diseñamos herramientas específicas para cada eslabón de la cadena productiva agrícola.
        </p>
      </div>
      <div className="relative z-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="group rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white p-8 shadow-sm transition-all hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[0.5rem] bg-[var(--ms-primary)]/10 text-[var(--ms-primary)] transition-colors group-hover:bg-[var(--ms-primary)] group-hover:text-white">
              <MaterialSymbol name={item.icon} />
            </div>
            <h3 className="mb-3 flex items-center text-xl font-bold text-[var(--ms-primary)]">
              {item.pro && <span className="mr-2 inline-flex"><ProBadge /></span>}
              {item.title}
            </h3>
            <p className="text-[var(--ms-on-surface-variant)]">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
