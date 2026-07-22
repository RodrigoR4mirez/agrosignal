import Link from 'next/link'
import { MaterialSymbol } from '../shared/MaterialSymbol'
import { ProBadge } from '../shared/ProBadge'

const LOTES = [
  {
    image: '/marketplace/cosecha-papas.jpg',
    status: 'En Cosecha',
    statusClass: 'bg-[var(--ms-primary)] text-white',
    riesgo: 'BAJO',
    riesgoClass: 'text-[var(--ms-primary)]',
    title: 'Papa Yungay Extra',
    place: 'Huancayo, Junín',
    price: 'S/ 1.80',
    verified: 'LOTE VERIFICADO LMR',
    cta: 'Contactar',
  },
  {
    image: '/marketplace/cosecha-mango.jpg',
    status: 'Próxima Cosecha (15 días)',
    statusClass: 'bg-[var(--ms-secondary-container)] text-[var(--ms-on-secondary-container)]',
    riesgo: 'MEDIO',
    riesgoClass: 'text-[var(--ms-secondary)]',
    title: 'Mango Kent Export',
    place: 'Tambogrande, Piura',
    price: 'S/ 4.50',
    verified: 'EXPORT READY',
    cta: 'Reservar Lote',
  },
  {
    image: '/marketplace/cosecha-esparrago.jpg',
    status: 'Disponible',
    statusClass: 'bg-[var(--ms-primary)] text-white',
    riesgo: 'BAJO',
    riesgoClass: 'text-[var(--ms-primary)]',
    title: 'Espárrago Verde',
    place: 'Chao, La Libertad',
    price: 'S/ 7.20',
    verified: 'GLOBAL G.A.P.',
    cta: 'Contactar',
  },
]

export function Cosechas() {
  return (
    <section className="relative bg-[var(--ms-surface-container)] py-24">
      <div className="ms-container px-6">
        <div className="mb-16 flex items-center justify-between">
          <h2 className="flex items-center text-4xl font-extrabold text-[var(--ms-primary)]">
            Cosechas Disponibles
            <MaterialSymbol name="lock" className="ml-2 !text-3xl text-[var(--ms-gold-accent)]" />
          </h2>
          <Link className="flex items-center gap-2 font-bold text-[var(--ms-primary)] hover:underline" href="/pro">
            Ver todo el mercado <MaterialSymbol name="arrow_right_alt" />
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {LOTES.map((lote) => (
            <div
              key={lote.title}
              className="group overflow-hidden rounded-[1rem] border border-[var(--ms-outline-variant)] bg-white shadow-sm transition-shadow hover:shadow-xl"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={lote.image} alt={lote.title} className="h-full w-full object-cover" />
                <div className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold ${lote.statusClass}`}>
                  {lote.status}
                </div>
                <div className="absolute top-4 right-4 flex flex-col items-center rounded-[0.5rem] bg-white/90 p-2 shadow-sm backdrop-blur">
                  <span className="text-[10px] font-bold text-[var(--ms-outline)]">RIESGO</span>
                  <span className={`text-xs font-black ${lote.riesgoClass}`}>{lote.riesgo}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="mb-1">
                      <ProBadge />
                    </div>
                    <h4 className="text-xl font-bold text-[var(--ms-primary)]">{lote.title}</h4>
                    <p className="text-sm text-[var(--ms-on-surface-variant)]">{lote.place}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-[var(--ms-secondary)]">{lote.price}</p>
                    <p className="text-[10px] text-[var(--ms-outline)]">POR KILO</p>
                  </div>
                </div>
                <div className="mb-6 flex items-center gap-2">
                  <MaterialSymbol name="verified" className="!text-sm text-[var(--ms-primary)]" />
                  <span className="text-xs font-bold text-[var(--ms-primary)]">{lote.verified}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/pro"
                    className="flex flex-1 items-center justify-center gap-1 rounded-[0.5rem] bg-[var(--ms-primary)] py-2 text-sm font-bold text-white"
                  >
                    <ProBadge /> {lote.cta}
                  </Link>
                  <button className="flex h-10 w-10 items-center justify-center rounded-[0.5rem] border border-[var(--ms-outline-variant)] text-[var(--ms-outline)] hover:text-[var(--ms-primary)]">
                    <MaterialSymbol name="favorite" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
