import { SELLOS } from '@/lib/marketplace/types'

// Escudo de la Verificación AgroSignal: con check si el lote cumple al menos un control.
export function EscudoVerificacion({ verificado, className = 'size-4' }: { verificado: boolean; className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v5.5c0 4.4-3 8.1-7 9.5-4-1.4-7-5.1-7-9.5V6z" />
    {verificado && <path d="M8.8 12.2l2.2 2.2 4.3-4.6" />}
  </svg>
}

// Distintivo de la Verificación AgroSignal: "Verificado 3/3" con escudo, o "Sin verificar".
export function SelloInocuidadBadge({ nivel }: { nivel: number }) {
  const n = SELLOS[nivel] ? nivel : 0
  const tono = n === 3 ? 'bg-musgo/15 text-bosque' : n ? 'bg-arena-claro text-bosque' : 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${tono}`}>
    <EscudoVerificacion verificado={n > 0} className={`size-4 ${n ? 'text-musgo' : 'text-gray-400'}`} />
    {SELLOS[n]}
  </span>
}
