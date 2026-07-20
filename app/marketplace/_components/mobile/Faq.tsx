import { MaterialSymbol } from '../shared/MaterialSymbol'

const FAQS = [
  {
    q: '¿Cómo se obtienen los precios?',
    a: 'Recopilamos datos de los principales mercados mayoristas del país y agencias internacionales en tiempo real.',
  },
  {
    q: '¿Tiene costo la aplicación?',
    a: 'Contamos con una versión gratuita con datos básicos y un plan Pro para gestión avanzada de lotes.',
  },
]

export function Faq() {
  return (
    <section className="space-y-6 px-6 py-12">
      <h3 className="text-center text-2xl leading-[32px] font-bold text-[var(--ms-on-surface)]">
        Preguntas Frecuentes
      </h3>
      <div className="space-y-3">
        {FAQS.map((faq) => (
          <details key={faq.q} className="rounded-[1rem] border border-[var(--ms-outline-variant)]/30 bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-[var(--ms-primary)]">
              {faq.q}
              <MaterialSymbol name="expand_more" />
            </summary>
            <p className="mt-3 text-sm text-[var(--ms-on-surface-variant)]">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
