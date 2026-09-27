import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { BuscadorAyuda } from '@/components/ayuda/BuscadorAyuda'
import { CurvasNivel, IconoApreton, IconoCertificado, IconoMercado, IconoPersona } from '@/components/landing/Iconos'
import { AbrirPreguntaEnlazada } from '@/components/ayuda/AbrirPreguntaEnlazada'

type Pregunta = [id: string, pregunta: string, respuesta: React.ReactNode]

const accountQuestions: Pregunta[] = [
  ['crear-cuenta', '¿Cómo creo una cuenta?', 'Elige Crear cuenta, indica si eres productor o comprador y completa los tres pasos. Confirma el correo con el enlace que recibirás antes de publicar o comprar.'],
  ['correo', 'No recibí el correo de verificación', 'Revisa spam y comprueba que escribiste bien tu correo. En la pantalla Confirma tu correo puedes pedir otro enlace. Espera unos minutos entre intentos. Si el servicio de correo no está disponible, vuelve a intentarlo más tarde.'],
  ['password', 'Olvidé mi contraseña', 'En Ingresar elige Olvidé mi contraseña. Te enviaremos un enlace para crear una nueva. Por tu seguridad, no indicamos si un correo está registrado.'],
  ['roles', '¿Qué diferencia hay entre los tipos de cuenta?', 'Los productores publican y gestionan sus cosechas. Los compradores consultan productos y gestionan sus pedidos. Las cuentas de administración son asignadas por el equipo de AgroSignal.'],
  ['cuenta-suspendida', '¿Qué hago si mi cuenta está suspendida?', 'Una cuenta suspendida conserva sus datos y puede navegar el catálogo público, pero no puede publicar ni comprar. La revisión y reactivación corresponden al equipo administrador.'],
  ['seguridad', '¿Cómo protejo mi cuenta?', 'Usa una contraseña de al menos 10 caracteres con letras y números. Evita reutilizarla y cierra sesión en equipos compartidos. Nunca compartas tu contraseña ni tus enlaces de acceso.'],
]
const sections: { id: string; title: string; icono: typeof IconoPersona; questions: Pregunta[] }[] = [
  { id: 'cuenta', title: 'Tu cuenta', icono: IconoPersona, questions: accountQuestions },
  { id: 'publicaciones', title: 'Publicar y encontrar cosechas', icono: IconoMercado, questions: [
    ['publicar', '¿Cómo publico un lote?', 'Ingresa como productor y abre Mi panel → Publicar lote. Completa los datos de la cosecha, su ubicación y las fotos en tres pasos. Revisa el precio, la unidad y la cantidad antes de publicar.'],
    ['fotos', '¿Qué fotos puedo subir?', 'Agrega entre 1 y 5 fotos de tu lote en JPG, PNG o WebP, de hasta 5 MB cada una. Usa imágenes que correspondan a la cosecha ofrecida. Las fotos del catálogo son públicas.'],
    ['borrador', 'Se interrumpió la publicación, ¿perdí el lote?', 'Revisa Mis lotes. Si se alcanzó a crear un borrador, puedes editarlo y terminar la publicación desde allí. Los borradores no aparecen en el catálogo.'],
    ['visibilidad', '¿Por qué mi lote no aparece en el marketplace?', 'Revisa que esté publicado, tenga fotos y una cantidad mayor que cero. La cuenta debe estar activa y con correo confirmado. Los lotes bloqueados por un test de residuos no aparecen en el catálogo.'],
    ['retirar', '¿Cómo retiro una publicación?', 'En Mis lotes puedes editar la cantidad disponible y ponerla en cero. Si el lote ya tiene pedidos o verificaciones, se conserva su historial y no se puede eliminar.'],
    ['buscar', '¿Cómo encuentro lo que necesito?', 'En Marketplace busca el cultivo y filtra por región, precio, destino o nivel de verificación. Abre la ficha para ver la unidad del precio, la cantidad disponible y el detalle de cada verificación.'],
  ] },
  { id: 'compras', title: 'Pedidos, entregas y pagos', icono: IconoApreton, questions: [
    ['comprar', '¿Cómo hago un pedido?', 'Ingresa como comprador, abre una ficha y elige Comprar. Indica la cantidad y la dirección de entrega; revisa el total antes de enviar. El pedido queda pendiente hasta que el productor lo confirme.'],
    ['stock', '¿Cuándo se reserva la cantidad?', 'La cantidad se descuenta al confirmar el productor, no al enviar la solicitud. Si ya no alcanza, no podrá confirmarse. Al cancelar un pedido confirmado antes del envío, la cantidad vuelve al lote.'],
    ['seguimiento', '¿Dónde veo el estado de mi pedido?', 'En Mi panel encontrarás Mis compras o Mis ventas. Abre el pedido para consultar el seguimiento: pendiente, confirmado, enviado y recibido. También verás si fue rechazado o cancelado y su motivo.'],
    ['cancelar', '¿Puedo cancelar una compra?', 'El comprador puede cancelar mientras el pedido esté pendiente o confirmado. El productor puede rechazar una solicitud pendiente o cancelar un pedido confirmado. Cada decisión pide confirmación; después del envío, las partes deben coordinar la solución con administración.'],
    ['pagos', '¿AgroSignal cobra o procesa el pago?', 'Por ahora AgroSignal registra pedidos y entregas; no procesa cobros ni reembolsos. Coordina con la otra parte el pago y el transporte mediante los datos del pedido. El total mostrado corresponde al acuerdo de compra.'],
    ['disputas', '¿Qué ocurre si hay un desacuerdo?', 'Conserva el código del pedido y coordina con la otra parte y la administración. Un administrador puede registrar una resolución visible para ambos o cancelar un pedido que todavía esté pendiente o confirmado.'],
    ['calificar', '¿Cómo califico una compra?', 'Cuando el comprador confirma que recibió la cosecha, comprador y productor tienen 14 días para calificarse desde el pedido, con 1 a 5 estrellas y un comentario opcional. Ninguno ve la calificación del otro hasta que ambos califican (o hasta que vence el plazo). Revísala antes de enviarla: no se puede cambiar.'],
  ] },
  { id: 'inocuidad', title: 'Verificación AgroSignal', icono: IconoCertificado, questions: [
    ['bpa', '¿Es lo mismo que el Sello BPA del SENASA?', <>
      <span className="block">No, son cosas distintas, y aceptamos con gusto el sello.</span>
      <span className="mt-3 block">El <strong className="font-semibold text-gray-800">Sello de Buenas Prácticas Agrícolas (BPA)</strong> es un distintivo <strong className="font-semibold text-gray-800">oficial</strong> del SENASA, creado por el MIDAGRI en 2025. Es gratuito y voluntario. Lo reciben los predios que el SENASA certifica en buenas prácticas, trae un código de verificación y dura dos años.</span>
      <span className="mt-3 block">La <strong className="font-semibold text-gray-800">Verificación AgroSignal</strong> es un control <strong className="font-semibold text-gray-800">propio</strong> de esta plataforma en tres niveles: no la otorga el SENASA ni la reemplaza.</span>
      <span className="mt-3 block"><strong className="font-semibold text-gray-800">Si tu predio tiene la certificación BPA</strong>, súbela en tu lote como certificado SENASA y suma el nivel 1 de la Verificación AgroSignal.</span>
      <a href="https://www.gob.pe/institucion/senasa/noticias/1290615-gobierno-fortalece-la-inocuidad-y-calidad-de-alimentos-con-nuevo-sello-del-senasa" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-petroleo underline underline-offset-4">Leer la nota oficial del SENASA<span className="sr-only"> (se abre en otra pestaña)</span></a>
    </>],
    ['niveles', '¿Qué significa Verificado 1/3, 2/3 o 3/3?', 'Cada lote puede pasar tres controles: documentos revisados (un certificado aprobado y vigente), campo inspeccionado (un vuelo con dron completado) y test de residuos (una prueba rápida con resultado aprobado). Verificado 3/3 indica que el lote cumplió los tres. En la ficha de cada lote ves el estado de cada control. El test de residuos es un examen preliminar y no reemplaza un análisis de laboratorio.'],
    ['documentos', '¿Cómo solicito una verificación?', 'Como productor, abre Mis lotes → Verificaciones. Puedes enviar un certificado con su vigencia y archivo, o solicitar una inspección con dron. La administración revisa los documentos y registra la evidencia de los vuelos y tests realizados.'],
    ['evidencia', '¿Quién puede ver mis documentos y evidencias?', 'Solo el productor dueño y la administración pueden abrir certificados, fotos de tests y evidencias de dron. El público ve el estado de las verificaciones. Si un enlace privado vence, actualiza la página para abrirlo nuevamente.'],
    ['test-fallido', '¿Qué pasa si un test indica No pasa?', 'El lote se bloquea y deja de aparecer en el marketplace. Se avisa al productor y a la administración, y se impiden nuevos pedidos y envíos. Registrar después un resultado Pasa no levanta el bloqueo anterior.'],
    ['exportacion', '¿La verificación garantiza que puedo exportar?', 'La plataforma recomienda contar con los tres controles para lotes destinados a exportación. El distintivo describe las verificaciones registradas: no reemplaza los requisitos del destino ni un análisis de laboratorio.'],
  ] },
]

const caja = 'app-container px-4 sm:px-6 lg:px-8'

export default function HelpPage() {
  return <AppShell anchoCompleto>
    <AbrirPreguntaEnlazada />
    <div>
      <section className="relative overflow-hidden bg-petroleo text-white">
        <CurvasNivel className="absolute -right-32 -top-24 w-[38rem] opacity-40" />
        <div className={`${caja} relative py-12 lg:py-16`}>
          <h1 className="text-4xl font-normal leading-tight text-white sm:text-5xl lg:text-[56px]">¿En qué te ayudamos?</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/80">Respuestas sobre tu cuenta, cómo publicar y comprar cosechas, y la Verificación AgroSignal.</p>
          <BuscadorAyuda />
        </div>
      </section>

      <div className="bg-crema">
        <div className={`${caja} grid gap-8 py-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14 lg:py-14`}>
          <nav aria-label="Temas de ayuda" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
              {sections.map(section => { const I = section.icono; return <li key={section.id} className="shrink-0"><a href={`#${section.id}`} className="flex min-h-11 items-center gap-3 whitespace-nowrap rounded-full bg-white px-4 text-sm font-semibold text-petroleo ring-1 ring-[#ebe4d4] hover:ring-petroleo/40 lg:rounded-xl lg:bg-transparent lg:ring-0 lg:hover:bg-white">
                <I className="size-6 shrink-0 text-musgo" />{section.title}<span className="ml-auto hidden text-xs font-normal text-gray-500 lg:inline">{section.questions.length}</span></a></li> })}
            </ul>
          </nav>

          <div id="preguntas" className="min-w-0 max-w-3xl space-y-12">
            {sections.map(section => { const I = section.icono; return <section id={section.id} key={section.id} data-tema className="scroll-mt-24" aria-labelledby={`${section.id}-title`}>
              <h2 id={`${section.id}-title`} className="mb-4 flex items-center gap-3 text-2xl font-normal text-petroleo sm:text-[28px]"><I className="size-9 shrink-0 text-musgo" />{section.title}</h2>
              <div className="divide-y divide-[#f0ebdf] overflow-hidden rounded-[22px] border border-[#ebe4d4] bg-white">
                {section.questions.map(([id, question, answer]) => <details key={id} id={id} data-pregunta className="group scroll-mt-28">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-semibold text-gray-900 hover:bg-crema/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-petroleo sm:px-6 [&::-webkit-details-marker]:hidden">
                    {question}
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-crema text-petroleo transition-transform duration-300 group-open:rotate-45 group-open:bg-naranja motion-reduce:transition-none"><svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></span>
                  </summary>
                  <div className="max-w-[65ch] px-5 pb-6 text-[15px] leading-relaxed text-gray-700 sm:px-6">{typeof answer === 'string' ? <p>{answer}</p> : answer}</div>
                </details>)}
              </div>
            </section> })}
            <p id="sin-resultados" hidden className="rounded-[22px] border border-dashed border-[#d9cfb8] bg-white px-6 py-10 text-center text-gray-700">Ninguna pregunta coincide con tu búsqueda. Prueba con otra palabra, como <strong className="font-semibold text-petroleo">pedido</strong>, <strong className="font-semibold text-petroleo">contraseña</strong> o <strong className="font-semibold text-petroleo">dron</strong>.</p>

            <aside aria-labelledby="accesos" className="rounded-[22px] bg-petroleo p-8 text-white sm:p-10">
              <h2 id="accesos" className="text-2xl font-normal text-white">Accesos rápidos</h2>
              <p className="mt-2 text-sm text-white/75">Lo que más se busca, a un clic.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/registro" className="inline-flex min-h-11 items-center rounded-full bg-naranja px-6 text-sm font-semibold text-petroleo hover:bg-[#f29a5e]">Crear cuenta</Link>
                <Link href="/recuperar-password" className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-6 text-sm hover:bg-white/10">Recuperar contraseña</Link>
                <Link href="/verificar-correo" className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-6 text-sm hover:bg-white/10">Confirmar correo</Link>
                <Link href="/marketplace" className="inline-flex min-h-11 items-center rounded-full border border-white/40 px-6 text-sm hover:bg-white/10">Ver productos</Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
}
