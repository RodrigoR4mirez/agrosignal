import { MaterialSymbol } from './shared/MaterialSymbol'

const COLUMNS = [
  { title: 'Compañía', links: ['Info Institucional', 'Soporte Técnico', 'Privacidad'] },
  { title: 'Recursos', links: ['Data Regional', 'Blog del Agro', 'Glosario PRO'] },
]

export function Footer() {
  return (
    <footer className="mt-12 bg-[var(--pro-surface-container-high)] px-6 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
        <div className="col-span-1">
          <div className="mb-6 flex items-center gap-2">
            <span className="text-xl leading-7 font-bold text-[var(--pro-on-surface)]">AgroSignal</span>
            <span className="font-bold text-[var(--pro-secondary)]">PRO</span>
          </div>
          <p className="text-sm leading-5 text-[var(--pro-on-surface-variant)]">
            Innovando el agro peruano con data de clase mundial. Empoderamos al productor con tecnología de
            precisión.
          </p>
          <div className="mt-6 flex gap-4">
            <a
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pro-surface-container-highest)] text-[var(--pro-primary)] transition-all hover:bg-[var(--pro-primary)] hover:text-[var(--pro-on-primary)]"
              href="#"
            >
              <MaterialSymbol name="share" />
            </a>
            <a
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pro-surface-container-highest)] text-[var(--pro-primary)] transition-all hover:bg-[var(--pro-primary)] hover:text-[var(--pro-on-primary)]"
              href="#"
            >
              <MaterialSymbol name="forum" />
            </a>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-6 text-xs leading-4 font-bold tracking-wider text-[var(--pro-on-surface)] uppercase">
              {col.title}
            </h4>
            <ul className="space-y-4">
              {col.links.map((link) => (
                <li key={link}>
                  <a
                    className="text-sm leading-5 text-[var(--pro-on-surface-variant)] transition-colors hover:text-[var(--pro-primary)]"
                    href="#"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="mb-6 text-xs leading-4 font-bold tracking-wider text-[var(--pro-on-surface)] uppercase">
            Contacto
          </h4>
          <p className="mb-4 text-sm leading-5 text-[var(--pro-on-surface-variant)]">
            Lima, Perú
            <br />
            contacto@agrosignal.pe
          </p>
          <a
            href="#lista-espera"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--pro-primary-container)] px-3 py-1 text-xs leading-4 font-bold text-[var(--pro-on-primary-container)]"
          >
            <MaterialSymbol name="bolt" className="!text-sm" />
            Agro-Tech Hub
          </a>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[var(--pro-outline-variant)] pt-12 md:flex-row">
        <p className="text-sm leading-5 text-[var(--pro-on-surface-variant)]">
          © {new Date().getFullYear()} AgroSignal Peru. Data powered by NASA &amp; FAO.
        </p>
        <div className="flex gap-6">
          <a className="text-sm leading-5 text-[var(--pro-on-surface-variant)] transition-all hover:underline" href="#">
            Términos de Servicio
          </a>
          <a className="text-sm leading-5 text-[var(--pro-on-surface-variant)] transition-all hover:underline" href="#">
            Cookies
          </a>
        </div>
      </div>
    </footer>
  )
}
