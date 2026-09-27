// Íconos de trazo fino para la landing (línea de 1.3, sin relleno).
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={className} {...base}>{children}</svg>
}

export const IconoMercado = ({ className }: { className?: string }) => <Svg className={className}><path d="M8 26h48l-4-14H12z" /><path d="M8 26c0 4 3 7 6 7s6-3 6-7c0 4 3 7 6 7s6-3 6-7c0 4 3 7 6 7s6-3 6-7c0 4 3 7 6 7s6-3 6-7" /><path d="M12 33v21h40V33" /><path d="M26 54V42h12v12" /></Svg>
export const IconoCertificado = ({ className }: { className?: string }) => <Svg className={className}><path d="M32 6l5 4 6-1 2 6 6 2-1 6 4 5-4 5 1 6-6 2-2 6-6-1-5 4-5-4-6 1-2-6-6-2 1-6-4-5 4-5-1-6 6-2 2-6 6 1z" /><path d="M25 28l5 5 10-10" /><path d="M22 44l-6 14 7-3 4 6 5-12M42 44l6 14-7-3-4 6-5-12" /></Svg>
export const IconoDron = ({ className }: { className?: string }) => <Svg className={className}><rect x="24" y="26" width="16" height="10" rx="3" /><path d="M24 29H12M40 29h12M16 29v-6M48 29v-6" /><ellipse cx="16" cy="21" rx="8" ry="2" /><ellipse cx="48" cy="21" rx="8" ry="2" /><path d="M28 36l-3 5M36 36l3 5" /><circle cx="32" cy="31" r="2" /><path d="M20 50c4-3 8-4 12-4s8 1 12 4M14 56c6-4 12-6 18-6s12 2 18 6" strokeDasharray="2 3" /></Svg>
export const IconoGarantia = ({ className }: { className?: string }) => <Svg className={className}><path d="M32 6l20 8v14c0 13-8 23-20 30C20 51 12 41 12 28V14z" /><rect x="24" y="28" width="16" height="12" rx="2" /><path d="M27 28v-4a5 5 0 0 1 10 0v4" /><circle cx="32" cy="34" r="1.5" /></Svg>
export const IconoFinanciamiento = ({ className }: { className?: string }) => <Svg className={className}><path d="M6 44h10l10 4h10a3 3 0 0 1 0 6H26" /><path d="M16 56h24l16-8a3 3 0 0 0-3-5l-13 5" /><path d="M6 40v20" /><path d="M36 34V20" /><path d="M36 22c0-6 4-10 10-10 0 6-4 10-10 10zM36 26c0-5-3-8-8-8 0 5 3 8 8 8z" /></Svg>
export const IconoEstrellas = ({ className }: { className?: string }) => <Svg className={className}><path d="M32 8l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" /><path d="M10 50l3 6 6 1-4 4 1 6M54 50l-3 6-6 1 4 4-1 6" transform="translate(0 -8)" /></Svg>
export const IconoPlan = ({ className }: { className?: string }) => <Svg className={className}><rect x="14" y="12" width="30" height="42" rx="3" /><path d="M24 8h10v8H24z" /><path d="M20 26h18M20 33h18M20 40h10" /><path d="M40 50l12-12 4 4-12 12-6 2z" /></Svg>
export const IconoBrote = ({ className }: { className?: string }) => <Svg className={className}><path d="M32 54V28" /><path d="M32 30c0-9 6-15 16-15 0 9-6 15-16 15zM32 36c0-8-5-13-13-13 0 8 5 13 13 13z" /><path d="M16 54c4-5 10-7 16-7s12 2 16 7" /></Svg>
export const IconoApreton = ({ className }: { className?: string }) => <Svg className={className}><path d="M4 30l10-10 10 4 8-4 6 4" /><path d="M60 30L50 20l-10 4" /><path d="M14 20l-4 16 14 12c2 2 5 2 7 0l14-13-9-9-7 6c-2 2-5 1-6-1" /><path d="M50 20l4 16" /></Svg>
export const IconoPersona = ({ className }: { className?: string }) => <Svg className={className}><circle cx="32" cy="22" r="11" /><path d="M12 56c2-11 10-18 20-18s18 7 20 18" /></Svg>
export const IconoCaja = ({ className }: { className?: string }) => <Svg className={className}><path d="M8 22l24-12 24 12v24L32 58 8 46z" /><path d="M8 22l24 12 24-12M32 34v24" /><path d="M20 16l24 12" /></Svg>
export const IconoGlobo = ({ className }: { className?: string }) => <Svg className={className}><circle cx="32" cy="32" r="22" /><path d="M10 32h44M32 10c7 7 10 14 10 22s-3 15-10 22c-7-7-10-14-10-22s3-15 10-22z" /></Svg>
export const IconoFabrica = ({ className }: { className?: string }) => <Svg className={className}><path d="M8 54V30l14 8v-8l14 8v-8l14 8V14h6v40z" /><path d="M16 46h6M28 46h6M40 46h6" /></Svg>
export const IconoCubiertos = ({ className }: { className?: string }) => <Svg className={className}><path d="M20 8v18a6 6 0 0 1-12 0V8M14 8v48" /><path d="M46 56V8c-6 4-9 12-9 20h9" /></Svg>

// Curvas de nivel propias: un contorno orgánico repetido a escalas decrecientes.
const CONTORNO = 'M200 30 C290 20 380 80 370 170 C362 245 300 250 280 320 C262 380 170 390 120 340 C70 290 20 250 40 170 C58 95 120 38 200 30 Z'
export function CurvasNivel({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 400 400" aria-hidden="true" className={`pointer-events-none ${className}`} fill="none">
    {[1, 0.8, 0.62, 0.45, 0.3, 0.17].map((escala, i) => <path key={escala} d={CONTORNO} stroke="#6f8f4e" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke"
      transform={`translate(200 205) rotate(${i * 9}) scale(${escala}) translate(-200 -205)`} />)}
  </svg>
}
