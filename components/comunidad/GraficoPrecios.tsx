import type { PuntoPrecio } from '@/lib/comunidad/types'

const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']
const soles = (v: number) => `S/ ${v.toFixed(2)}`
const etiquetaMes = (mes: string) => { const [a, m] = mes.split('-').map(Number); return `${MES[m - 1]} ${String(a).slice(2)}` }

// Gráfico mensual en SVG: franja mín.–máx., precio publicado (petróleo) y de venta (naranja).
// Opcional: línea punteada con el precio del lote que se está viendo.
export function GraficoPrecios({ serie, actual, titulo }: { serie: PuntoPrecio[]; actual?: number; titulo: string }) {
  const W = 640, H = 250, L = 56, R = 16, T = 16, B = 30
  const valores = serie.flatMap(p => [p.minimo, p.maximo]).concat(actual ? [actual] : [])
  const bajo = Math.min(...valores), alto = Math.max(...valores)
  const margen = Math.max((alto - bajo) * 0.15, alto * 0.05)
  const min = Math.max(0, bajo - margen), max = alto + margen
  const x = (i: number) => serie.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (serie.length - 1)
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B)
  const linea = (clave: 'publicado' | 'vendido') => serie.map((p, i) => p[clave] === null ? null : `${x(i)},${y(p[clave]!)}`).filter(Boolean).join(' ')
  const franja = [...serie.map((p, i) => `${x(i)},${y(p.maximo)}`), ...serie.map((p, i) => `${x(i)},${y(p.minimo)}`).reverse()].join(' ')
  const ticks = Array.from({ length: 4 }, (_, i) => min + ((max - min) * (i + 0.5)) / 4)
  const ultimo = serie.at(-1)
  return <figure className="min-w-0">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${titulo}. ${ultimo ? `Último mes: publicado ${ultimo.publicado !== null ? soles(ultimo.publicado) : 'sin datos'} por kg${ultimo.vendido !== null ? `, vendido ${soles(ultimo.vendido)} por kg` : ''}.` : ''}`} className="w-full">
      {ticks.map(v => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#ebe4d4" /><text x={L - 8} y={y(v) + 4} textAnchor="end" className="fill-gray-500 text-[11px] tabular-nums">{soles(v)}</text></g>)}
      {serie.length > 1 && <polygon points={franja} className="fill-trigo/25" />}
      {actual && <g><line x1={L} x2={W - R} y1={y(actual)} y2={y(actual)} strokeDasharray="5 5" className="stroke-tierra" strokeWidth="1.5" /><text x={W - R} y={y(actual) - 6} textAnchor="end" className="fill-tierra text-[11px] font-semibold">Este lote · {soles(actual)}</text></g>}
      <polyline points={linea('publicado')} fill="none" className="stroke-petroleo" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={linea('vendido')} fill="none" className="stroke-naranja" strokeWidth="2.5" strokeDasharray="1 6" strokeLinecap="round" />
      {serie.map((p, i) => <g key={p.mes}>
        {p.publicado !== null && <circle cx={x(i)} cy={y(p.publicado)} r="4" className="fill-petroleo stroke-white" strokeWidth="2"><title>{`${etiquetaMes(p.mes)}: publicado ${soles(p.publicado)}/kg`}</title></circle>}
        {p.vendido !== null && <circle cx={x(i)} cy={y(p.vendido)} r="4" className="fill-naranja stroke-white" strokeWidth="2"><title>{`${etiquetaMes(p.mes)}: vendido ${soles(p.vendido)}/kg`}</title></circle>}
        <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-gray-500 text-[11px]">{etiquetaMes(p.mes)}</text>
      </g>)}
    </svg>
    <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
      <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-0.5 w-5 rounded bg-petroleo" />Precio publicado (promedio)</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-2.5 rounded-full bg-naranja" />Precio de venta (promedio)</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="h-2.5 w-5 rounded-sm bg-trigo/40" />Rango mín.–máx.</span>
    </figcaption>
    <table className="sr-only"><caption>{titulo}</caption><thead><tr><th>Mes</th><th>Publicado (S/ por kg)</th><th>Vendido (S/ por kg)</th><th>Mínimo</th><th>Máximo</th></tr></thead>
      <tbody>{serie.map(p => <tr key={p.mes}><td>{etiquetaMes(p.mes)}</td><td>{p.publicado ?? '—'}</td><td>{p.vendido ?? '—'}</td><td>{p.minimo}</td><td>{p.maximo}</td></tr>)}</tbody></table>
  </figure>
}
