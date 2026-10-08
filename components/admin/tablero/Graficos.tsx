import { money } from '@/lib/marketplace/types'

const corto = (v: number) => v === 0 ? 'S/ 0' : v >= 1e6 ? `S/ ${(v / 1e6).toLocaleString('es-PE', { maximumFractionDigits: 1 })} M` : v >= 1e3 ? `S/ ${(v / 1e3).toLocaleString('es-PE', { maximumFractionDigits: 1 })} mil` : money(v)
const semanaTexto = (iso: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
const tooltip = 'pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg bg-petroleo px-3 py-2 text-left text-xs text-white shadow-lg group-hover:block group-focus-visible:block'

// Valor acordado por semana: una sola serie, barras finas con extremo redondeado sobre la línea base.
export function BarrasSemanales({ semanas }: { semanas: { semana: string; pedidos: number; valor: number }[] }) {
  const max = Math.max(1, ...semanas.map(s => Number(s.valor)))
  const tope = Math.pow(10, Math.floor(Math.log10(max))) * Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max))))
  const cada = Math.max(1, Math.ceil(semanas.length / 5))
  return <figure>
    <div className="flex gap-3">
      <div aria-hidden="true" className="-mt-1.5 flex h-49 flex-col justify-between text-right text-[11px] tabular-nums text-gray-400">{[tope, tope / 2, 0].map(v => <span key={v}>{corto(v)}</span>)}</div>
      <div className="relative min-w-0 flex-1 pb-7">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-46 flex flex-col justify-between">{[0, 1, 2].map(i => <span key={i} className={`border-t ${i === 2 ? 'border-gray-300' : 'border-dashed border-linea'}`} />)}</div>
        <ol className="relative flex h-46 items-end gap-[2px]">{semanas.map((s, i) => <li key={s.semana} className="group relative flex h-full flex-1 flex-col justify-end focus-visible:outline-2 focus-visible:outline-petroleo" tabIndex={0} aria-label={`Semana del ${semanaTexto(s.semana)}: ${money(Number(s.valor))} en ${s.pedidos} pedidos`}>
          <span className="mx-auto w-full max-w-7 shrink-0 rounded-t-[4px] bg-petroleo transition-colors group-hover:bg-bosque-claro" style={{ height: `${(Number(s.valor) / tope) * 100}%`, minHeight: Number(s.valor) ? 2 : 0 }} />
          <span className={tooltip}><strong className="block">Semana del {semanaTexto(s.semana)}</strong>{money(Number(s.valor))} · {s.pedidos} {s.pedidos === 1 ? 'pedido' : 'pedidos'}</span>
          {i % cada === 0 && <span aria-hidden="true" className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[11px] text-gray-500">{semanaTexto(s.semana)}</span>}
        </li>)}</ol>
      </div>
    </div>
    <details className="mt-3 text-sm"><summary className="cursor-pointer text-xs font-semibold text-petroleo">Ver como tabla</summary>
      <div className="mt-2 overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-gray-500"><th className="py-1 font-medium">Semana</th><th className="py-1 text-right font-medium">Pedidos</th><th className="py-1 text-right font-medium">Valor acordado</th></tr></thead><tbody>{semanas.map(s => <tr key={s.semana} className="border-t border-linea-suave"><td className="py-1">{semanaTexto(s.semana)}</td><td className="py-1 text-right tabular-nums">{s.pedidos}</td><td className="py-1 text-right tabular-nums">{money(Number(s.valor))}</td></tr>)}</tbody></table></div>
    </details>
  </figure>
}

// Embudo de fases: barras horizontales relativas a las solicitudes, con conversión desde la fase anterior.
export function Embudo({ fases }: { fases: { fase: string; n: number }[] }) {
  const base = Math.max(1, fases[0]?.n ?? 0)
  return <ol className="space-y-3">{fases.map((f, i) => {
    const previa = i ? fases[i - 1].n : null
    const conversion = previa ? Math.round((f.n / previa) * 100) : null
    return <li key={f.fase} className="group relative grid grid-cols-[8.5rem_1fr_auto] items-center gap-3 text-sm" tabIndex={0} aria-label={`${f.fase}: ${f.n}${conversion !== null ? `, ${conversion}% de la fase anterior` : ''}`}>
      <span className="text-gray-700">{f.fase}</span>
      <span className="h-3 rounded-full bg-[#f3eee3]"><span className="block h-3 rounded-full bg-petroleo" style={{ width: `${(f.n / base) * 100}%`, minWidth: f.n ? 6 : 0 }} /></span>
      <span className="w-24 text-right tabular-nums"><strong className="text-gray-900">{f.n}</strong>{conversion !== null && <span className="ml-1.5 text-xs text-gray-500">{conversion}%</span>}</span>
    </li>
  })}</ol>
}

// Ranking corto con barra fina proporcional al valor.
export function Ranking({ filas, enlace }: { filas: { id?: string; nombre: string; pedidos: number; valor: number }[]; enlace?: (id: string) => string }) {
  if (!filas.length) return <p className="text-sm text-gray-500">Sin ventas acordadas en el periodo.</p>
  const max = Math.max(1, ...filas.map(f => Number(f.valor)))
  return <ol className="space-y-3">{filas.map(f => <li key={f.id ?? f.nombre} className="text-sm">
    <div className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate text-gray-800">{f.id && enlace ? <a href={enlace(f.id)} className="hover:underline">{f.nombre}</a> : f.nombre}</span><span className="shrink-0 tabular-nums text-gray-900">{money(Number(f.valor))}</span></div>
    <div className="mt-1.5 flex items-center gap-2"><span className="h-1.5 flex-1 rounded-full bg-[#f3eee3]"><span className="block h-1.5 rounded-full bg-petroleo" style={{ width: `${(Number(f.valor) / max) * 100}%` }} /></span><span className="w-16 text-right text-xs tabular-nums text-gray-500">{f.pedidos} ped.</span></div>
  </li>)}</ol>
}
