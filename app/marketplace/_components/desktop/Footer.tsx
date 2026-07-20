import { MaterialSymbol } from '../shared/MaterialSymbol'

const COLUMNS = [
  {
    title: 'Plataforma',
    links: ['Mercado de Cosechas', 'Red de Transporte', 'Exportación Inteligente', 'Mapas de Riesgo'],
  },
  {
    title: 'Soporte',
    links: ['Preguntas Frecuentes', 'Centro de Ayuda', 'Contactar Asesor', 'Reportar Incidente'],
  },
  {
    title: 'Legal',
    links: ['Términos y Condiciones', 'Política de Privacidad', 'Cookies', 'Libro de Reclamaciones'],
  },
]

export function Footer() {
  return (
    <footer className="relative bg-[var(--ms-primary-container)] py-20 text-white">
      <div className="ms-container px-6">
        <div className="mb-16 grid gap-12 md:grid-cols-4">
          <div className="space-y-6">
            <span className="text-3xl font-bold tracking-tighter">AgroSignal</span>
            <p className="text-sm leading-relaxed opacity-60">
              Conectando el campo peruano con el mundo a través de datos y tecnología financiera avanzada.
            </p>
            <div className="flex gap-4">
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[var(--ms-secondary-container)] hover:text-[var(--ms-primary)]"
                href="#"
              >
                <MaterialSymbol name="face_nod" />
              </a>
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[var(--ms-secondary-container)] hover:text-[var(--ms-primary)]"
                href="#"
              >
                <MaterialSymbol name="alternate_email" />
              </a>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h5 className="mb-6 text-lg font-bold text-[var(--ms-secondary-container)]">{col.title}</h5>
              <ul className="space-y-4 text-sm opacity-70">
                {col.links.map((link) => (
                  <li key={link}>
                    <a className="hover:text-[var(--ms-secondary-container)]" href="#">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
