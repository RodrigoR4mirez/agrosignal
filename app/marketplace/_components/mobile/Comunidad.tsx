import { MaterialSymbol } from '../shared/MaterialSymbol'

const ICONS = ['chat', 'share', 'videocam']

export function Comunidad() {
  return (
    <section className="border-y border-[var(--ms-outline-variant)]/20 bg-white px-6 py-12 text-center">
      <h3 className="text-2xl leading-[32px] font-bold text-[var(--ms-on-surface)]">Únete a la Comunidad</h3>
      <p className="mt-2 mb-6 text-sm leading-5 text-[var(--ms-on-surface-variant)]">
        Más de 5,000 productores compartiendo conocimiento.
      </p>
      <div className="flex justify-center gap-6">
        {ICONS.map((icon) => (
          <div
            key={icon}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ms-primary)]/10 text-[var(--ms-primary)]"
          >
            <MaterialSymbol name={icon} />
          </div>
        ))}
      </div>
    </section>
  )
}
