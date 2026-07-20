import { MaterialSymbol } from './MaterialSymbol'

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-[0.25rem] bg-[var(--ms-gold-accent)] px-2 py-0.5 text-[10px] font-bold text-white">
      <MaterialSymbol name="lock" className="!text-[12px]" />
      PRO
    </span>
  )
}
