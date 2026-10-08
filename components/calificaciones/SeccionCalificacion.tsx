import { Card } from '@/components/ui/Card'
import { ETIQUETAS_ESTRELLAS, fechaCorta, tiempoRelativo, type CalificacionPropia, type EstadoCalificacion } from '@/lib/calificaciones/types'
import { FormularioCalificacion } from './FormularioCalificacion'
import { Avatar, Estrellas, IconoCandado } from './Reputacion'

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] || nombre

function Opinion({ titulo, nombre, calificacion, tono }: { titulo: string; nombre: string; calificacion: Pick<CalificacionPropia, 'estrellas' | 'comentario' | 'creado_en'>; tono: 'arena' | 'bosque' }) {
  return <article className="flex gap-4">
    <Avatar nombre={nombre} tono={tono} />
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500">{titulo}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1"><Estrellas valor={calificacion.estrellas} tamano={16} /><span className="text-sm font-semibold text-cacao">{ETIQUETAS_ESTRELLAS[calificacion.estrellas]}</span><time dateTime={calificacion.creado_en} className="text-xs text-gray-500">{tiempoRelativo(calificacion.creado_en)}</time></div>
      {calificacion.comentario ? <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-gray-800 wrap-anywhere">{calificacion.comentario}</p> : <p className="mt-3 text-sm italic text-gray-500">Sin comentario.</p>}
    </div>
  </article>
}

// `amplio`: relleno de 28 px desde sm, para alinearse con las tarjetas del detalle del pedido.
export function SeccionCalificacion({ pedidoId, estado, contraparte, yo, amplio = false }: { pedidoId: string; estado: EstadoCalificacion | null; contraparte: string; yo: string; amplio?: boolean }) {
  if (!estado?.habilitado) return null
  const p = amplio ? 'sm:p-7' : ''
  const otro = primerNombre(contraparte)
  const { mia, otra } = estado

  if (!mia) {
    if (estado.vencido) return <Card className={`space-y-4 ${p}`}>
      <h2 className="text-xl font-medium text-bosque">El plazo para calificar este pedido ya venció</h2>
      <p className="max-w-prose text-sm leading-relaxed text-gray-600">Las calificaciones se reciben durante 14 días desde que el pedido se marcó como recibido. Esta ventana cerró{estado.cierre ? ` el ${fechaCorta(estado.cierre)}` : ''}.</p>
      {otra && <div className="border-t border-[#e4e0d2] pt-5"><Opinion titulo={`Lo que opinó ${otro}`} nombre={contraparte} calificacion={otra} tono="bosque" /></div>}
    </Card>
    return <Card className={`border-[#e4d7bd] ${p}`}><FormularioCalificacion pedidoId={pedidoId} rol={estado.rol} contraparte={otro} cierre={estado.cierre} otraEnviada={estado.otra_enviada} /></Card>
  }

  if (otra) return <Card className={`space-y-6 ${p}`}>
    <div>
      <h2 className="text-xl font-medium text-bosque">Las dos calificaciones ya están a la vista</h2>
      <p className="mt-1 text-sm text-gray-600">Gracias por cerrar el trato con una opinión honesta. Así crece la confianza entre quienes cultivan y quienes compran.</p>
    </div>
    <div className="grid gap-6 border-t border-[#e4e0d2] pt-6 md:grid-cols-2 md:gap-10">
      <Opinion titulo="Tu calificación" nombre={yo} calificacion={mia} tono="arena" />
      <Opinion titulo={`Lo que opinó ${otro}`} nombre={contraparte} calificacion={otra} tono="bosque" />
    </div>
  </Card>

  if (mia.visible) return <Card className={`space-y-5 ${p}`}>
    <h2 className="text-xl font-medium text-bosque">Tu calificación ya es pública</h2>
    <p className="text-sm text-gray-600">{otro} no calificó dentro del plazo, así que tu opinión se publicó igual para que no se pierda.</p>
    <div className="border-t border-[#e4e0d2] pt-5"><Opinion titulo="Tu calificación" nombre={yo} calificacion={mia} tono="arena" /></div>
  </Card>

  return <Card className="sellada border-[#e4d7bd] p-0">
    <div className={`sellada-contenido min-h-52 p-6 sm:min-h-44 ${p}`} aria-hidden="true"><Opinion titulo="Tu calificación" nombre={yo} calificacion={mia} tono="arena" /></div>
    <div className={`sellada-vidrio flex items-center p-6 ${p}`}>
      <div className="flex max-w-xl items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bosque text-arena-claro shadow-sm"><IconoCandado className="size-6" /></span>
        <div>
          <h2 className="text-xl font-medium text-bosque">Calificación guardada y sellada</h2>
          <p className="mt-1 text-sm leading-relaxed text-cacao">Gracias por contarnos cómo te fue. Tu opinión espera a que {otro} también califique, así ninguno influye en el otro.{estado.cierre ? ` Se abrirá sola a más tardar el ${fechaCorta(estado.cierre)}.` : ''}</p>
        </div>
      </div>
    </div>
    <p className="sr-only">Enviaste {mia.estrellas} de 5 estrellas. Tu calificación queda oculta hasta que {otro} califique.</p>
  </Card>
}
