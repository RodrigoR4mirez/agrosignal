import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'card-surface bg-white border border-linea p-6',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[26px] font-bold text-gray-900 mb-1 tracking-tight leading-snug', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm font-medium text-gray-500 leading-relaxed', className)} {...props} />
}

// Cifra destacada de los paneles: etiqueta arriba, valor grande y una nota opcional.
// `compacta` para columnas angostas (resumen lateral de precios).
export function Metrica({ etiqueta, valor, nota, compacta = false, className }: { etiqueta: ReactNode; valor: ReactNode; nota?: ReactNode; compacta?: boolean; className?: string }) {
  return <div className={cn('card-surface min-w-0 border border-linea bg-white p-5 sm:p-6', className)}>
    <p className="text-sm text-gray-600">{etiqueta}</p>
    <p className={cn('mt-2 font-semibold leading-tight tabular-nums text-petroleo wrap-anywhere', compacta ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl')}>{valor}</p>
    {nota && <div className="mt-2 text-xs leading-relaxed text-gray-500">{nota}</div>}
  </div>
}
