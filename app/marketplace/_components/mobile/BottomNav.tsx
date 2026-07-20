import { MaterialSymbol } from '../shared/MaterialSymbol'

const ITEMS = [
  { icon: 'home', label: 'Inicio', active: true },
  { icon: 'inventory_2', label: 'Carga', active: false },
  { icon: 'warning', label: 'Riesgo', active: false },
  { icon: 'person', label: 'Perfil', active: false },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-around rounded-t-[24px] border-t border-[var(--ms-outline-variant)] bg-[var(--ms-surface)] px-4 shadow-lg lg:hidden">
      {ITEMS.map((item) =>
        item.active ? (
          <a
            key={item.label}
            className="flex flex-col items-center justify-center rounded-full bg-[var(--ms-secondary-container)] px-4 py-1 text-[var(--ms-on-secondary-container)]"
            href="#"
          >
            <MaterialSymbol name={item.icon} filled />
            <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
          </a>
        ) : (
          <a
            key={item.label}
            className="flex flex-col items-center justify-center text-[var(--ms-on-surface-variant)]"
            href="#"
          >
            <MaterialSymbol name={item.icon} />
            <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
          </a>
        )
      )}
    </nav>
  )
}
