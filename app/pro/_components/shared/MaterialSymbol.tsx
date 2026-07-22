import { cn } from '@/lib/utils'

export function MaterialSymbol({
  name,
  filled = false,
  className,
}: {
  name: string
  filled?: boolean
  className?: string
}) {
  return (
    <span className={cn('material-symbols-outlined', filled && 'material-symbols-fill', className)}>
      {name}
    </span>
  )
}
