import type { ReactNode } from 'react'
import { tituloPagina } from '@/components/ui/estilos'

// Cabecera común de los paneles: antetítulo y título a la izquierda, acciones a la derecha
// (en el celular bajan debajo del título). Las acciones van de secundaria a principal.
export function CabeceraPanel({ antetitulo, titulo, children }: { antetitulo: ReactNode; titulo: ReactNode; children?: ReactNode }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
    <div className="min-w-0">
      <div className="mb-2 text-sm font-semibold text-tierra">{antetitulo}</div>
      <h1 className={`${tituloPagina} wrap-anywhere`}>{titulo}</h1>
    </div>
    {children && <div className="flex flex-wrap gap-3">{children}</div>}
  </div>
}
