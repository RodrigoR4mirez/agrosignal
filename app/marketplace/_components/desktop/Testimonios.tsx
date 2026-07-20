import { MaterialSymbol } from '../shared/MaterialSymbol'
import { PlaceholderImage } from '../shared/PlaceholderImage'

const TESTIMONIOS = [
  {
    name: 'Eusebio Quispe',
    role: 'Productor de Quinua • Puno',
    quote:
      '"Antes vendía a lo que me ofrecían en la chacra. Con AgroSignal logré contactar a un exportador y me pagaron el doble."',
  },
  {
    name: 'Ana Maria Torres',
    role: 'Compradora Mayorista • Lima',
    quote:
      '"La trazabilidad es clave. Saber que el producto viene verificado me da la seguridad para vender a mis clientes premium."',
  },
  {
    name: 'Raúl Sanchez',
    role: 'Transportista • Ica',
    quote:
      '"Nunca más volví con el camión vacío. Las cargas compartidas me han permitido optimizar mis rutas y ganar más por viaje."',
  },
]

export function Testimonios() {
  return (
    <section className="ms-container relative px-6 py-24">
      <h2 className="mb-16 text-center text-4xl font-extrabold text-[var(--ms-primary)]">
        Ellos ya confían en AgroSignal
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIOS.map((t) => (
          <div key={t.name} className="relative rounded-[1.5rem] border border-[var(--ms-outline-variant)] bg-white p-8">
            <MaterialSymbol name="format_quote" className="absolute top-4 right-4 !text-6xl text-[var(--ms-primary)]/5" />
            <div className="mb-6 flex items-center gap-4">
              <PlaceholderImage icon="person" tone="primary" className="h-14 w-14 rounded-full" />
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-xs text-[var(--ms-outline)]">{t.role}</p>
              </div>
            </div>
            <p className="text-[var(--ms-on-surface-variant)] italic">{t.quote}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
