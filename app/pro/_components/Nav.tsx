export function Nav() {
  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between bg-[var(--pro-surface)]/80 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-[32px] leading-[40px] font-bold text-[var(--pro-primary)]">AgroSignal</span>
        <span className="rounded-full bg-[var(--pro-secondary-fixed)] px-3 py-1 text-xs leading-4 font-bold tracking-wider text-[var(--pro-on-secondary-fixed)]">
          PRO
        </span>
      </div>
      <div className="hidden items-center gap-6 md:flex">
        <a className="text-xs leading-4 font-bold text-[var(--pro-on-surface-variant)] transition-colors hover:text-[var(--pro-primary)]" href="#">
          Visión
        </a>
        <a className="text-xs leading-4 font-bold text-[var(--pro-on-surface-variant)] transition-colors hover:text-[var(--pro-primary)]" href="#">
          Innovación
        </a>
        <a
          className="rounded-full bg-[var(--pro-primary)] px-6 py-2 text-xs leading-4 font-bold text-[var(--pro-on-primary)] transition-transform hover:scale-105 active:scale-95"
          href="#lista-espera"
        >
          Reservar Acceso
        </a>
      </div>
    </nav>
  )
}
