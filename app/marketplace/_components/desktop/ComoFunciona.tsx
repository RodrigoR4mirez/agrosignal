import { MaterialSymbol } from '../shared/MaterialSymbol'

const STEPS = [
  {
    n: 1,
    rotate: 'rotate-3',
    title: 'Publica tu Lote',
    desc: 'Sube fotos y datos de tu cultivo. Nuestro sistema lo analiza y le otorga un sello de confianza preliminar.',
  },
  {
    n: 2,
    rotate: '-rotate-2',
    title: 'Organiza el Flete',
    desc: 'Usa nuestra red de transportistas verificados o únete a una carga compartida para reducir costos.',
  },
  {
    n: 3,
    rotate: 'rotate-1',
    title: 'Cobra Seguro',
    lock: true,
    desc: 'Recibe el pago mediante nuestra pasarela segura una vez que el comprador confirma la recepción.',
  },
]

export function ComoFunciona() {
  return (
    <section className="relative bg-[var(--ms-primary)] py-24 text-white">
      <div className="ms-container px-6 text-center">
        <h2 className="mb-8 text-4xl font-extrabold">Tres pasos para crecer</h2>
        <div className="mb-12 inline-flex rounded-[1rem] bg-white/10 p-1">
          <button className="rounded-[0.5rem] bg-white px-8 py-2 font-bold text-[var(--ms-primary)]">
            Soy Productor
          </button>
          <button className="rounded-[0.5rem] px-8 py-2 font-bold text-white">Soy Comprador</button>
        </div>
      </div>
      <div className="ms-container relative grid gap-12 px-6 md:grid-cols-3">
        <div className="absolute top-1/2 left-1/4 right-1/4 hidden h-0.5 -translate-y-12 border-t-2 border-dashed border-white/20 md:block" />
        {STEPS.map((step) => (
          <div key={step.n} className="relative z-10 space-y-6">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[1rem] bg-[var(--ms-secondary-container)] text-2xl font-black text-[var(--ms-primary)] shadow-xl ${step.rotate}`}
            >
              {step.n}
            </div>
            <h4 className="text-xl font-bold">
              {step.title} {step.lock && <MaterialSymbol name="lock" className="!text-sm align-middle text-[var(--ms-gold-accent)]" />}
            </h4>
            <p className="text-sm opacity-70">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
