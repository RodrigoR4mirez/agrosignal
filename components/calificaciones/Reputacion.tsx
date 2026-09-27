import { calificacionesTexto, fechaCorta, promedioTexto, tieneReputacion, tiempoRelativo, type Reputacion, type Resena } from '@/lib/calificaciones/types'

export const RUTA_ESTRELLA = 'M12 2.8l2.76 5.6 6.18.9-4.47 4.36 1.05 6.15L12 16.9l-5.52 2.91 1.05-6.15L3.06 9.3l6.18-.9L12 2.8z'

// Estrellas de solo lectura con relleno parcial (4,6 → cuatro llenas y 60% de la quinta).
export function Estrellas({ valor, tamano = 16, className = '' }: { valor: number; tamano?: number; className?: string }) {
  return <span role="img" aria-label={`${promedioTexto(valor)} de 5 estrellas`} className={`inline-flex items-center gap-0.5 ${className}`}>
    {[0, 1, 2, 3, 4].map(i => {
      const relleno = Math.max(0, Math.min(1, valor - i)) * 100
      return <span key={i} aria-hidden="true" className="relative inline-block" style={{ width: tamano, height: tamano }}>
        <svg viewBox="0 0 24 24" width={tamano} height={tamano} className="absolute inset-0 fill-arena stroke-[#c9b48a]" strokeWidth={1.2}><path d={RUTA_ESTRELLA} /></svg>
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${relleno}%` }}><svg viewBox="0 0 24 24" width={tamano} height={tamano} className="fill-[#d4a017] stroke-[#b8860f]" strokeWidth={1.2}><path d={RUTA_ESTRELLA} /></svg></span>
      </span>
    })}
  </span>
}

export function IconoBrote({ className = 'size-5' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 21v-9" /><path d="M12 12c0-4 3-6.5 7-6.5 0 4-3 6.5-7 6.5z" /><path d="M12 14.5c0-3-2.4-5-5.5-5 0 3 2.4 5 5.5 5z" /></svg>
}

export function IconoCandado({ className = 'size-5' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /><path d="M12 14.5v2.5" /></svg>
}

// Etiqueta discreta para tarjetas: reputación del productor, subordinada a la verificación del lote.
export function ReputacionCompacta({ promedio, total, className = '' }: { promedio: number | null; total: number; className?: string }) {
  if (promedio === null || !tieneReputacion(total)) return <span className={`inline-flex items-center gap-1 text-xs font-semibold text-musgo ${className}`}><IconoBrote className="size-3.5" />Nuevo en la plataforma</span>
  return <span className={`inline-flex items-center gap-1.5 text-xs text-gray-600 ${className}`}>
    <Estrellas valor={promedio} tamano={13} />
    <span className="font-bold tabular-nums text-cacao">{promedioTexto(promedio)}</span>
    <span className="tabular-nums">({total})</span>
  </span>
}

// Resumen del perfil: el promedio es el momento tipográfico fuerte; la distribución da contexto.
export function ResumenReputacion({ reputacion, nombre }: { reputacion: Reputacion; nombre: string }) {
  const { total, promedio, distribucion } = reputacion
  if (!tieneReputacion(total) || promedio === null) {
    return <div className="flex flex-wrap items-start gap-4 rounded-[18px] border border-dashed border-musgo/50 bg-salvia/70 p-5">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-musgo/15 text-musgo"><IconoBrote className="size-6" /></span>
      <div className="min-w-0 flex-1 basis-56">
        <p className="font-display text-xl font-medium text-bosque">Nuevo en la plataforma</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-gray-600">
          {total === 0 ? `${nombre} todavía no tiene calificaciones.` : `${nombre} tiene ${calificacionesTexto(total)}.`} Mostramos el promedio desde la tercera, para que una sola opinión no defina a nadie.
        </p>
      </div>
    </div>
  }
  return <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
    <div>
      <p className="font-display text-6xl font-medium leading-none tabular-nums text-cacao">{promedioTexto(promedio)}</p>
      <Estrellas valor={promedio} tamano={20} className="mt-3" />
      <p className="mt-2 text-sm text-gray-600">{calificacionesTexto(total)}</p>
    </div>
    <ol aria-label="Distribución de calificaciones" className="space-y-2">
      {(['5', '4', '3', '2', '1'] as const).map(estrellas => {
        const cantidad = distribucion[estrellas], porcentaje = Math.round((cantidad / total) * 100)
        return <li key={estrellas} className="grid grid-cols-[2.25rem_1fr_2.75rem] items-center gap-3 text-sm">
          <span className="tabular-nums text-gray-700">{estrellas} <span aria-hidden="true" className="text-[#b8860f]">★</span><span className="sr-only">{estrellas === '1' ? 'estrella' : 'estrellas'}</span></span>
          <span className="barra-reputacion block h-2.5 overflow-hidden rounded-full bg-arena/60" aria-hidden="true"><span className={`block h-full rounded-full ${Number(estrellas) >= 4 ? 'bg-[#d4a017]' : Number(estrellas) === 3 ? 'bg-musgo' : 'bg-tierra'}`} style={{ width: `${porcentaje}%` }} /></span>
          <span className="text-right tabular-nums text-gray-600">{porcentaje}%<span className="sr-only"> ({cantidad})</span></span>
        </li>
      })}
    </ol>
  </div>
}

export function Avatar({ nombre, tono = 'arena' }: { nombre: string; tono?: 'arena' | 'bosque' }) {
  const inicial = nombre.trim().charAt(0).toUpperCase() || '?'
  return <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full font-display text-lg font-medium ${tono === 'bosque' ? 'bg-bosque text-arena-claro' : 'bg-arena text-cacao'}`}>{inicial}</span>
}

export function TarjetaResena({ resena }: { resena: Pick<Resena, 'autor' | 'estrellas' | 'comentario' | 'creado_en'> }) {
  return <article className="flex gap-4 border-t border-[#e4e0d2] py-6 first:border-t-0 first:pt-0">
    <Avatar nombre={resena.autor} />
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold text-gray-900">{resena.autor}</p>
        <time dateTime={resena.creado_en} title={fechaCorta(resena.creado_en)} className="text-xs text-gray-500">{tiempoRelativo(resena.creado_en)}</time>
      </div>
      <Estrellas valor={resena.estrellas} tamano={14} className="mt-1.5" />
      {resena.comentario ? <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-gray-700 wrap-anywhere">{resena.comentario}</p> : <p className="mt-3 text-sm italic text-gray-500">Calificó sin dejar comentario.</p>}
    </div>
  </article>
}
