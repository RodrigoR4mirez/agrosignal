import Link from 'next/link'
import { QueueEmpty, adminLink } from '@/components/admin/AdminUI'
import { BarrasSemanales, Embudo, Ranking } from '@/components/admin/tablero/Graficos'
import { EtiquetaPedido } from '@/components/transacciones/EtiquetaPedido'
import type { Tablero } from '@/lib/admin/tablero'
import { money, quantity } from '@/lib/marketplace/types'
import { Metrica } from '@/components/ui/Card'
import { METODOS_PAGO, type MetodoPago } from '@/lib/transacciones/types'

const tarjeta = 'rounded-[22px] border border-linea bg-white p-6'
const horas = (h: number | null) => h === null ? '—' : h < 48 ? `${Number(h).toLocaleString('es-PE', { maximumFractionDigits: 1 })} h` : `${Math.round(h / 24)} días`
const pct = (a: number, b: number) => b ? `${Math.round((a / b) * 100)} %` : '—'

// Cuerpo del tablero de transacciones (indicadores, alertas, gráficos, rankings y tabla).
export function TableroVista({ t, error }: { t: Tablero | null; error: boolean }) {
  return <>
    {error || !t ? <QueueEmpty error>No pudimos cargar el tablero. Intenta nuevamente.</QueueEmpty> : <div className="space-y-6">
      {/* Indicadores */}
      <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[
        ['Valor acordado', money(Number(t.kpis.valor_acordado)), `${t.kpis.acuerdos} acuerdos · ticket promedio ${money(Number(t.kpis.ticket_promedio))}`],
        ['Valor con pago confirmado', money(Number(t.kpis.valor_pagado)), Number(t.kpis.valor_mercado_pago) ? `${money(Number(t.kpis.valor_mercado_pago))} por Mercado Pago` : 'Pago directo registrado'],
        ['Tasa de acuerdo', pct(t.kpis.acuerdos, t.kpis.pedidos), `${t.kpis.pedidos} solicitudes · ${t.kpis.rechazados} rechazadas · ${t.kpis.cancelados} canceladas`],
        ['Compras concluidas', String(t.kpis.concluidos), `${pct(t.kpis.concluidos, t.kpis.acuerdos)} de los acuerdos llegó a recepción`],
        ['Respuesta del productor', horas(t.kpis.horas_respuesta), 'Promedio de solicitud a acuerdo'],
        ['Del acuerdo al pago', horas(t.kpis.horas_hasta_pago), 'Promedio hasta el pago confirmado'],
        ['Compradores activos', String(t.kpis.compradores), 'Con al menos una solicitud'],
        ['Productores con pedidos', String(t.kpis.productores), 'Recibieron al menos una solicitud'],
      ].map(([titulo, valor, pie]) => <Metrica key={titulo} etiqueta={titulo} valor={valor} nota={pie} className="p-4 sm:p-6" />)}</section>

      {/* Alertas operativas */}
      <section aria-labelledby="alertas" className={tarjeta}>
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="alertas" className="text-xl font-normal text-petroleo">Requieren atención hoy</h2><p className="text-xs text-gray-500">Estado actual, sin importar el periodo</p></div>
        <ul className="mt-4 divide-y divide-linea-suave">{t.alertas.map(a => <li key={a.clave} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <span className="flex items-center gap-3 text-sm"><span className={`grid min-w-8 place-items-center rounded-full px-2 py-1 text-xs font-semibold tabular-nums ${a.ids.length ? 'bg-amber-100 text-amber-950' : 'bg-gray-100 text-gray-500'}`}>{a.ids.length}</span><span className={a.ids.length ? 'text-gray-900' : 'text-gray-500'}>{a.titulo}</span></span>
          {a.ids.length > 0 && <span className="flex flex-wrap gap-2">{a.ids.slice(0, 4).map(id => <Link key={id} href={`/admin/pedidos/${id}`} className="rounded-full bg-crema px-3 py-1 font-mono text-xs text-petroleo hover:bg-arena-claro">#{id.slice(0, 8)}</Link>)}{a.ids.length > 4 && <span className="text-xs text-gray-500">y {a.ids.length - 4} más</span>}</span>}
        </li>)}</ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-labelledby="semanal" className={tarjeta}><h2 id="semanal" className="text-xl font-normal text-petroleo">Valor acordado por semana</h2><p className="mb-5 mt-1 text-xs text-gray-500">Pedidos creados en la semana que llegaron a acuerdo (sin cancelados).</p><BarrasSemanales semanas={t.semanas} /></section>
        <section aria-labelledby="embudo" className={tarjeta}><h2 id="embudo" className="text-xl font-normal text-petroleo">Embudo de compra</h2><p className="mb-5 mt-1 text-xs text-gray-500">Pedidos del flujo de 6 fases en el periodo. El porcentaje compara con la fase anterior.</p><Embudo fases={t.embudo} />
          {t.metodos.length > 0 && <div className="mt-6 border-t border-linea-suave pt-4"><p className="text-sm font-semibold text-gray-800">Pagos confirmados por método</p><ul className="mt-2 space-y-1.5 text-sm">{t.metodos.map(m => <li key={m.metodo} className="flex justify-between gap-3"><span className="text-gray-600">{METODOS_PAGO[m.metodo as MetodoPago] ?? 'Sin registro'}</span><span className="tabular-nums">{m.pedidos} · {money(Number(m.valor))}</span></li>)}</ul></div>}
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{([
        ['Cultivos', t.cultivos, undefined], ['Regiones', t.regiones, undefined],
        ['Productores', t.productores, (id: string) => `/marketplace/productor/${id}`], ['Compradores', t.compradores, (id: string) => `/compradores/${id}`],
      ] as const).map(([titulo, filas, enlace]) => <section key={titulo} className={tarjeta}><h2 className="mb-4 text-lg font-normal text-petroleo">{titulo} por valor</h2><Ranking filas={[...filas]} enlace={enlace} /></section>)}</div>

      {/* Trazabilidad */}
      <section aria-labelledby="tabla" className={tarjeta}>
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="tabla" className="text-xl font-normal text-petroleo">Últimas transacciones</h2><p className="text-xs text-gray-500">Las 50 más recientes del periodo · el CSV incluye todas</p></div>
        {t.transacciones.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[56rem] text-sm">
          <thead><tr className="border-b border-linea text-left text-xs text-gray-500"><th className="py-2 font-medium">Pedido</th><th className="py-2 font-medium">Fecha</th><th className="py-2 font-medium">Cultivo</th><th className="py-2 font-medium">Comprador → Productor</th><th className="py-2 pr-6 text-right font-medium">Total</th><th className="py-2 font-medium">Estado</th><th className="py-2 font-medium">Comprobante</th><th className="py-2" /></tr></thead>
          <tbody className="divide-y divide-linea-suave">{t.transacciones.map(p => <tr key={p.id}>
            <td className="py-2.5 font-mono text-xs"><Link href={`/admin/pedidos/${p.id}`} className="text-petroleo hover:underline">#{p.id.slice(0, 8)}</Link>{p.ejemplo && <span className="ml-1.5 rounded bg-trigo/30 px-1.5 py-0.5 font-sans text-xs text-cacao">Ejemplo</span>}</td>
            <td className="py-2.5 whitespace-nowrap text-gray-600">{new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(p.creado_en))}</td>
            <td className="py-2.5">{p.cultivo}<span className="block text-xs text-gray-500">{quantity(p.cantidad)} {p.unidad}</span></td>
            <td className="py-2.5 text-gray-700">{p.comprador_nombre}<span className="block text-xs text-gray-500">→ {p.productor_nombre}</span></td>
            <td className="py-2.5 pr-6 text-right tabular-nums">{money(Number(p.total))}</td>
            <td className="py-2.5"><EtiquetaPedido order={p} /></td>
            <td className="py-2.5 text-xs text-gray-600">{p.comprobante_numero ?? '—'}</td>
            <td className="py-2.5 text-right">{p.flujo === 2 && !['pendiente', 'rechazado'].includes(p.estado) && <Link href={`/pedidos/${p.id}/orden`} className={`${adminLink} min-h-0 text-xs`}>Orden</Link>}</td>
          </tr>)}</tbody>
        </table></div> : <p className="mt-4 text-sm text-gray-500">No hay transacciones en el periodo.</p>}
      </section>
      <p className="text-xs leading-relaxed text-gray-500">Valor acordado: suma de pedidos que llegaron a acuerdo (no incluye rechazados ni cancelados). No son cobros de AgroSignal: el pago es directo entre las partes o por Mercado Pago a la cuenta del productor.</p>
    </div>}
  </>
}
