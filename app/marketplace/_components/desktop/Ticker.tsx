const PRICES = [
  { name: 'PAPA AMARILLA', price: 'S/ 3.20', trend: 'up' as const },
  { name: 'PALTA HASS', price: 'S/ 8.50', trend: 'flat' as const },
  { name: 'CAFÉ ARÁBICA', price: 'S/ 12.40', trend: 'down' as const },
  { name: 'MANGO KENT', price: 'S/ 5.10', trend: 'up' as const },
  { name: 'ARÁNDANO', price: 'S/ 15.00', trend: 'up' as const },
]

const TREND_ARROW = { up: '▲', flat: '►', down: '▼' }
const TREND_COLOR = {
  up: 'text-[var(--ms-primary)]',
  flat: 'text-[var(--ms-secondary)]',
  down: 'text-[var(--ms-error)]',
}

function TickerGroup() {
  return (
    <div className="flex items-center gap-12">
      {PRICES.map((item) => (
        <span key={item.name} className="flex items-center gap-2 text-sm font-bold text-[var(--ms-on-surface)]">
          <span className="text-[var(--ms-outline)]">{item.name}</span>
          <span className="font-mono">{item.price}</span>
          <span className={TREND_COLOR[item.trend]}>{TREND_ARROW[item.trend]}</span>
        </span>
      ))}
    </div>
  )
}

export function Ticker() {
  return (
    <div className="absolute top-24 left-0 z-30 flex h-10 w-full items-center overflow-hidden border-b border-[var(--ms-outline-variant)]/30 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="ms-ticker-content items-center gap-12 px-6">
        <TickerGroup />
        <TickerGroup />
      </div>
    </div>
  )
}
