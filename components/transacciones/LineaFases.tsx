import { NOMBRE_FASE, faseActual, fasesDe, siguientePaso, type Fase } from '@/lib/transacciones/fases'
import type { Pedido } from '@/lib/transacciones/types'

type Rol = 'comprador' | 'productor'
type Estado = 'hecha' | 'actual' | 'pendiente' | 'gris'

const dia = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(v))
// Quién hace cada fase (ver docs/MODULOS/03-transacciones.md); en la fase actual manda siguientePaso().
const ACTOR: Record<Fase, Rol | 'ambos'> = { solicitud: 'comprador', acuerdo: 'productor', pago: 'comprador', despacho: 'productor', recepcion: 'comprador', cierre: 'ambos' }
const PARTE: Record<Rol, string> = { comprador: 'Comprador', productor: 'Productor' }
const SR: Record<Estado, string> = { hecha: 'completada', actual: 'fase actual', pendiente: 'pendiente', gris: 'no se realizó' }
const transicion = 'transition-colors duration-500 motion-reduce:transition-none'

function fechaDe(p: Pedido, f: Fase) {
  return { solicitud: p.creado_en, acuerdo: p.acordado_en, pago: p.pago_confirmado_en, despacho: p.enviado_en, recepcion: p.recibido_en, cierre: p.comprobante_en }[f] ?? null
}

// Color del tramo que une dos fases: degradado donde cambia el estado.
function conector(a: Estado, b: Estado) {
  if (a === 'gris') return 'bg-gray-200'
  if (a === 'hecha' && b === 'hecha') return 'bg-musgo'
  if (a === 'hecha') return 'bg-linear-to-b from-musgo to-trigo md:bg-linear-to-r'
  if (a === 'actual') return 'bg-linear-to-b from-trigo to-arena md:bg-linear-to-r'
  return 'bg-arena'
}

function Check() {
  return <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
}

function Circulo({ estado, ocurrio }: { estado: Estado; ocurrio: boolean }) {
  if (estado === 'hecha') return <span className={`grid size-9 place-items-center rounded-full bg-musgo text-white ${transicion}`}><Check /></span>
  if (estado === 'actual') return <span className={`size-9 rounded-full border-[5px] border-trigo bg-white ${transicion}`} />
  if (estado === 'gris' && ocurrio) return <span className="grid size-9 place-items-center rounded-full bg-gray-200 text-gray-500"><Check /></span>
  return <span className={`size-4 rounded-full ${estado === 'gris' ? 'bg-gray-200' : 'bg-arena'} ${transicion}`} />
}

// Línea de tiempo de las fases de un pedido: vertical en celular, stepper horizontal desde md.
export function LineaFases({ order, role }: { order: Pedido; role: Rol }) {
  const fases = fasesDe(order), actual = faseActual(order), paso = siguientePaso(order, role)
  const indice = actual === 'completado' ? fases.length : actual === 'terminado' ? -1 : fases.indexOf(actual)
  const estados: Estado[] = fases.map((_, i) => indice < 0 ? 'gris' : i < indice ? 'hecha' : i === indice ? 'actual' : 'pendiente')
  const otra = PARTE[role === 'comprador' ? 'productor' : 'comprador']
  const quien = (f: Fase, e: Estado) => {
    if (e === 'actual' && paso.quien !== 'nadie') return paso.quien === 'yo' ? 'Tú' : otra
    const a = ACTOR[f]
    return a === 'ambos' ? 'Ambas partes' : a === role ? 'Tú' : PARTE[a]
  }

  return <div className="rounded-[22px] border border-[#ebe4d4] bg-white p-6 sm:p-7">
    <div className="flex items-center justify-between gap-3">
      <h2 id="fases" className="text-sm font-semibold text-bosque/70">Avance del pedido</h2>
      {indice >= 0 && <span className="rounded-full bg-crema px-3 py-1 text-xs font-semibold text-bosque">{indice >= fases.length ? 'Completado' : `Fase ${indice + 1} de ${fases.length}`}</span>}
    </div>
    <ol aria-labelledby="fases" className="mt-6 flex flex-col md:flex-row">
      {fases.map((f, i) => {
        const e = estados[i], fecha = fechaDe(order, f), gris = e === 'gris'
        return <li key={f} aria-current={e === 'actual' ? 'step' : undefined} className="relative flex min-w-0 gap-4 pb-6 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-3 md:pb-0 md:text-center">
          {i < fases.length - 1 && <span aria-hidden="true" className={`absolute top-[18px] -bottom-[18px] left-[16px] w-1 rounded-full md:top-[16px] md:bottom-auto md:left-1/2 md:-right-1/2 md:h-1 md:w-auto ${conector(e, estados[i + 1])} ${transicion}`} />}
          <span aria-hidden="true" className="relative grid size-9 shrink-0 place-items-center"><Circulo estado={e} ocurrio={!!fecha} /></span>
          <div className="min-w-0 pt-1.5 md:px-1 md:pt-0">
            <p className={`text-sm ${gris ? 'font-medium text-gray-500' : e === 'pendiente' ? 'font-medium text-bosque/60' : 'font-semibold text-bosque'}`}>
              {NOMBRE_FASE[f]}<span className="sr-only"> ({gris && fecha ? SR.hecha : SR[e]})</span>
            </p>
            <p className={`mt-0.5 text-xs ${gris ? 'text-gray-500' : 'text-bosque/70'}`}>{quien(f, e)}{e === 'actual' && ' · ahora'}</p>
            {fecha && e !== 'pendiente' && <time dateTime={fecha} className={`mt-0.5 block text-xs ${gris ? 'text-gray-500' : 'text-bosque/70'}`}>{dia(fecha)}</time>}
          </div>
        </li>
      })}
    </ol>
    {indice < 0 && <p className="mt-6 text-sm text-gray-500">{order.estado === 'rechazado' ? 'Solicitud rechazada.' : 'Pedido cancelado.'}</p>}
  </div>
}
