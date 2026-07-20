import { cn } from '@/lib/utils'
import { MaterialSymbol } from './MaterialSymbol'

/**
 * Reemplaza las fotos del export de Stitch (apuntaban a URLs temporales de
 * Google que no son propias y pueden dejar de cargar). Bloque de color con
 * la paleta del design system + ícono, listo para sustituir por fotos reales.
 */
export function PlaceholderImage({
  icon = 'image',
  tone = 'primary',
  className,
}: {
  icon?: string
  tone?: 'primary' | 'gold' | 'dark'
  className?: string
}) {
  const gradients = {
    primary: 'from-[var(--ms-primary-container)] to-[var(--ms-primary)]',
    gold: 'from-[var(--ms-secondary-fixed)] to-[var(--ms-secondary-container)]',
    dark: 'from-[var(--ms-inverse-surface)] to-[var(--ms-primary)]',
  }
  return (
    <div className={cn('flex items-center justify-center bg-gradient-to-br', gradients[tone], className)}>
      <MaterialSymbol name={icon} className="!text-5xl text-white/40" />
    </div>
  )
}
