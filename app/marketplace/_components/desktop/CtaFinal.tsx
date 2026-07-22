import Link from 'next/link'
import { MaterialSymbol } from '../shared/MaterialSymbol'
import { ProBadge } from '../shared/ProBadge'

const CARDS = [
  {
    icon: 'agriculture',
    title: 'Soy Agricultor',
    desc: 'Publica tus lotes y accede a asesoría técnica.',
    cta: 'Empezar Gratis',
    pro: false,
  },
  {
    icon: 'shopping_cart',
    title: 'Soy Comprador',
    desc: 'Accede a productos verificados con trazabilidad.',
    cta: 'Registrarme',
    pro: false,
  },
  {
    icon: 'local_shipping',
    title: 'Soy Transportista',
    desc: 'Optimiza tus rutas y encuentra nuevas cargas.',
    cta: 'Afiliar mi Flota',
    pro: true,
  },
]

export function CtaFinal() {
  return (
    <section className="relative overflow-hidden bg-[var(--ms-surface-container)] py-24">
      <div className="ms-container relative z-10 px-6 text-center">
        <h2 className="mb-6 flex items-center justify-center text-5xl font-extrabold text-[var(--ms-primary)]">
          ¿Listo para transformar tu futuro agrícola?
          <MaterialSymbol name="lock" className="ml-2 !text-4xl text-[var(--ms-gold-accent)]" />
        </h2>
        <p className="mx-auto mb-12 max-w-3xl text-xl text-[var(--ms-on-surface-variant)]">
          Únete hoy a la comunidad AgroSignal y empieza a gestionar tu negocio con datos, seguridad y eficiencia.
        </p>
        <div className="flex flex-col justify-center gap-6 md:flex-row">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="group max-w-sm flex-1 rounded-[1.5rem] border border-[var(--ms-outline-variant)] bg-white p-8 shadow-xl transition-all hover:border-[var(--ms-primary)]"
            >
              <MaterialSymbol name={card.icon} filled className="mb-4 !text-4xl text-[var(--ms-primary)]" />
              <h4 className="mb-2 text-xl font-bold">{card.title}</h4>
              <p className="mb-6 text-sm text-[var(--ms-outline)]">{card.desc}</p>
              {card.pro ? (
                <Link
                  href="/pro"
                  className="block w-full rounded-[1rem] bg-[var(--ms-primary)] py-3 text-center font-bold text-white transition-colors group-hover:bg-[var(--ms-secondary-container)] group-hover:text-[var(--ms-primary)]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ProBadge /> {card.cta}
                  </span>
                </Link>
              ) : (
                <button className="w-full rounded-[1rem] bg-[var(--ms-primary)] py-3 font-bold text-white transition-colors group-hover:bg-[var(--ms-secondary-container)] group-hover:text-[var(--ms-primary)]">
                  {card.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
