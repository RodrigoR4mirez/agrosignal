const LINKS = ['Vender cosecha', 'Comprar', 'Transporte', 'Exportar', 'Asesoría', 'Comunidad']

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 z-[100] flex w-full items-center justify-between border-b border-[var(--ms-outline-variant)] bg-[var(--ms-surface)]/90 px-6 py-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-bold tracking-tighter text-[var(--ms-primary)]">AgroSignal</span>
        <div className="hidden items-center gap-6 text-base font-medium text-[var(--ms-on-surface-variant)] lg:flex">
          {LINKS.map((link) => (
            <a key={link} className="transition-colors hover:text-[var(--ms-primary)]" href="#">
              {link}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="rounded-[1rem] px-4 py-2 font-semibold text-[var(--ms-primary)] transition-all hover:bg-[var(--ms-surface-container)]">
          Iniciar sesión
        </button>
        <button className="rounded-[1rem] bg-[var(--ms-primary)] px-6 py-2.5 font-bold text-white shadow-lg shadow-[var(--ms-primary)]/20 transition-all hover:scale-[1.02] active:scale-95">
          Crear cuenta gratis
        </button>
      </div>
    </nav>
  )
}
