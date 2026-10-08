import { quantity } from '@/lib/marketplace/types'
import { NOMBRE_FASE, faseActual, fasesDe, siguientePaso, type Fase } from '@/lib/transacciones/fases'
import { COMPROBANTES, FORMAS_PAGO, METODOS_PAGO, type Pedido } from '@/lib/transacciones/types'

type Rol = 'comprador' | 'productor'
type Estado = 'hecha' | 'actual' | 'pendiente' | 'gris'

const dia = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'America/Lima' }).format(new Date(v))
// Quién hace cada fase (ver docs/MODULOS/03-transacciones.md); en la fase actual manda siguientePaso().
const ACTOR: Record<Fase, Rol | 'ambos'> = { solicitud: 'comprador', acuerdo: 'productor', pago: 'comprador', despacho: 'productor', recepcion: 'comprador', cierre: 'ambos' }
const PARTE: Record<Rol, string> = { comprador: 'Comprador', productor: 'Productor' }
const SR: Record<Estado, string> = { hecha: 'completada', actual: 'fase actual', pendiente: 'pendiente', gris: 'no se realizó' }
const transicion = 'transition-colors duration-500 motion-reduce:transition-none'

// Íconos de trazo (24 px) para cada fase.
const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const Svg = ({ className, children }: { className: string; children: React.ReactNode }) => <svg viewBox="0 0 24 24" aria-hidden="true" className={className} {...trazo}>{children}</svg>
const ICONO: Record<Fase, React.ReactNode> = {
  solicitud: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  acuerdo: <><path d="m11 17 2 2a1 1 0 1 0 3-3" /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" /><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8" /></>,
  pago: <><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9.5h.01M18 14.5h.01" /></>,
  despacho: <><path d="M3 5.5h11V16H3z" /><path d="M14 9h4l3 3.5V16h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  recepcion: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
  cierre: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
}
const Check = ({ className }: { className: string }) => <Svg className={className}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
const Persona = () => <Svg className="size-4 shrink-0"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 3.5-6 7-6s6 2 7 6" /></Svg>
const Calendario = () => <Svg className="size-4 shrink-0"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Svg>

function fechaDe(p: Pedido, f: Fase) {
  return { solicitud: p.creado_en, acuerdo: p.acordado_en, pago: p.pago_confirmado_en, despacho: p.enviado_en, recepcion: p.recibido_en, cierre: p.comprobante_en }[f] ?? null
}

// Dato breve de cada fase, tomado del pedido.
function detalleDe(p: Pedido, f: Fase) {
  if (f === 'solicitud') return `${quantity(p.cantidad)} ${p.unidad}`
  if (f === 'acuerdo') return p.propuesta_en ? 'Con contrapropuesta' : 'Precio y fecha de entrega'
  if (f === 'pago') return p.pago_metodo ? METODOS_PAGO[p.pago_metodo] : FORMAS_PAGO[p.forma_pago ?? 'antes_envio'][0]
  if (f === 'despacho') return p.entrega === 'recojo' ? 'Recojo en chacra' : p.transportista || 'Envío al comprador'
  if (f === 'recepcion') return p.observacion_en ? 'Con observación' : 'Revisión de la cosecha'
  return p.comprobante_tipo ? COMPROBANTES[p.comprobante_tipo] : 'Comprobante y calificaciones'
}

// Color del tramo que une dos fases: degradado donde cambia el estado.
function conector(a: Estado, b: Estado) {
  if (a === 'gris') return 'bg-gray-200'
  if (a === 'hecha' && b === 'hecha') return 'bg-musgo'
  if (a === 'hecha') return 'bg-linear-to-b from-musgo from-40% to-trigo'
  if (a === 'actual') return 'bg-linear-to-b from-trigo to-arena'
  return 'bg-arena'
}

function Circulo({ estado, ocurrio }: { estado: Estado; ocurrio: boolean }) {
  if (estado === 'hecha') return <span className={`grid size-10 place-items-center rounded-full bg-musgo text-white ${transicion}`}><Check className="size-5" /></span>
  if (estado === 'actual') return <span className={`size-10 rounded-full border-[7px] border-trigo bg-white ${transicion}`} />
  if (estado === 'gris' && ocurrio) return <span className="grid size-10 place-items-center rounded-full bg-gray-200 text-gray-500"><Check className="size-5" /></span>
  return <span className={`size-5 rounded-full ${estado === 'gris' ? 'bg-gray-200' : 'bg-arena'} ${transicion}`} />
}

const TESELA: Record<Estado, string> = { hecha: 'bg-musgo/10 text-musgo', actual: 'bg-trigo/25 text-cacao', pendiente: 'bg-crema text-bosque/40', gris: 'bg-gray-100 text-gray-400' }

// Línea de tiempo de las fases de un pedido, con resumen en píldoras arriba.
export function LineaFases({ order, role }: { order: Pedido; role: Rol }) {
  const fases = fasesDe(order), actual = faseActual(order), paso = siguientePaso(order, role)
  const indice = actual === 'completado' ? fases.length : actual === 'terminado' ? -1 : fases.indexOf(actual)
  const estados: Estado[] = fases.map((_, i) => indice < 0 ? 'gris' : i < indice ? 'hecha' : i === indice ? 'actual' : 'pendiente')
  const otra = PARTE[role === 'comprador' ? 'productor' : 'comprador']
  const quien = (f: Fase, e: Estado) => {
    if (e === 'actual' && paso.quien !== 'nadie') return paso.quien === 'yo' ? 'Tú · te toca' : `${otra} · en espera`
    const a = ACTOR[f]
    return a === 'ambos' ? 'Ambas partes' : a === role ? 'Tú' : PARTE[a]
  }
  const faltan = fases.length - indice
  const pie = indice < 0 ? (order.estado === 'rechazado' ? 'Solicitud rechazada' : 'Pedido cancelado')
    : indice >= fases.length ? 'Compra concluida' : `${faltan === 1 ? 'Falta 1 fase' : `Faltan ${faltan} fases`} para cerrar la compra`

  return <div className="relative pb-2.5">
    <div aria-hidden="true" className="absolute inset-x-6 top-6 bottom-0 rounded-[22px] bg-white/70 ring-1 ring-[#ebe4d4]" />
    <div className="relative rounded-[22px] bg-white p-5 shadow-[0_20px_40px_-30px_rgba(19,53,53,0.5)] ring-1 ring-[#ebe4d4] sm:p-7">
      <h2 id="fases" className="text-sm text-bosque/60">Avance del pedido</h2>

      <div aria-hidden="true" className="mt-5 flex items-center gap-1.5 sm:gap-2">
        {fases.map((f, i) => {
          const e = estados[i]
          if (e === 'actual') return <span key={f} className="inline-flex h-9 items-center rounded-full bg-bosque px-4 text-xs font-semibold tracking-[0.08em] text-white uppercase sm:h-10 sm:text-sm">Fase {i + 1}</span>
          const hecho = e === 'hecha' || (e === 'gris' && !!fechaDe(order, f))
          return <span key={f} className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold sm:size-10 ${e === 'gris' ? 'bg-gray-100 text-gray-400' : hecho ? 'bg-arena-claro text-bosque' : 'bg-arena-claro/60 text-bosque/50'}`}>{hecho ? <Check className="size-4" /> : i + 1}</span>
        })}
      </div>

      <ol aria-labelledby="fases" className="mt-7">
        {fases.map((f, i) => {
          const e = estados[i], fecha = fechaDe(order, f), gris = e === 'gris'
          return <li key={f} aria-current={e === 'actual' ? 'step' : undefined} className="relative flex gap-3 pb-6 last:pb-0 sm:gap-4">
            {i < fases.length - 1 && <span aria-hidden="true" className={`absolute top-5 -bottom-5 left-4 w-2 rounded-full ${conector(e, estados[i + 1])} ${transicion}`} />}
            <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center"><Circulo estado={e} ocurrio={!!fecha} /></span>
            <div className="min-w-0 flex-1">
              <p className={`text-base leading-snug sm:text-lg ${gris ? 'text-gray-500' : e === 'pendiente' ? 'text-bosque/60' : 'font-medium text-bosque'}`}>
                {NOMBRE_FASE[f]}<span className="sr-only"> ({gris && fecha ? SR.hecha : SR[e]})</span>
              </p>
              <p className={`mt-1 flex items-center gap-1.5 text-sm ${gris ? 'text-gray-500' : e === 'actual' ? 'font-semibold text-tierra' : 'text-tierra'}`}><Persona />{quien(f, e)}</p>
              <p className={`mt-0.5 flex flex-wrap items-center gap-x-3 text-sm ${gris ? 'text-gray-400' : 'text-bosque/55'}`}>
                {fecha && e !== 'pendiente' && <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><Calendario /><time dateTime={fecha}>{dia(fecha)}</time></span>}
                <span className="min-w-0 wrap-anywhere">{detalleDe(order, f)}</span>
              </p>
            </div>
            <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center self-start rounded-xl sm:size-11 sm:rounded-2xl ${TESELA[e]} ${transicion}`}><Svg className="size-5 sm:size-6">{ICONO[f]}</Svg></span>
          </li>
        })}
      </ol>

      <p className={`mt-7 text-base ${indice < 0 ? 'text-gray-500' : 'text-bosque'}`}>{pie}</p>
    </div>
  </div>
}
