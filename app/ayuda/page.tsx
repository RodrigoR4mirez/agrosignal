import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'

const accountQuestions = [
  ['crear-cuenta', '¿Cómo creo una cuenta?', 'Elige Crear cuenta, indica si eres productor o comprador y completa los tres pasos. Confirma el correo con el enlace que recibirás antes de publicar o comprar.'],
  ['correo', 'No recibí el correo de verificación', 'Revisa spam y comprueba que escribiste bien tu correo. En la pantalla Confirma tu correo puedes pedir otro enlace. Espera unos minutos entre intentos. Si el servicio de correo no está disponible, vuelve a intentarlo más tarde.'],
  ['password', 'Olvidé mi contraseña', 'En Ingresar elige Olvidé mi contraseña. Te enviaremos un enlace para crear una nueva. Por tu seguridad, no indicamos si un correo está registrado.'],
  ['roles', '¿Qué diferencia hay entre los tipos de cuenta?', 'Los productores publican y gestionan sus cosechas. Los compradores consultan productos y gestionan sus pedidos. Las cuentas de administración son asignadas por el equipo de AgroSignal.'],
  ['cuenta-suspendida', '¿Qué hago si mi cuenta está suspendida?', 'Una cuenta suspendida conserva sus datos y puede navegar el catálogo público, pero no puede publicar ni comprar. La revisión y reactivación corresponden al equipo administrador.'],
  ['seguridad', '¿Cómo protejo mi cuenta?', 'Usa una contraseña de al menos 10 caracteres con letras y números. Evita reutilizarla y cierra sesión en equipos compartidos. Nunca compartas tu contraseña ni tus enlaces de acceso.'],
]
const sections = [
  { id: 'cuenta', title: 'Tu cuenta', questions: accountQuestions },
  { id: 'publicaciones', title: 'Publicar y encontrar cosechas', questions: [
    ['publicar', '¿Cómo publico un lote?', 'Ingresa como productor y abre Mi panel → Publicar lote. Completa los datos de la cosecha, su ubicación y las fotos en tres pasos. Revisa el precio, la unidad y la cantidad antes de publicar.'],
    ['fotos', '¿Qué fotos puedo subir?', 'Agrega entre 1 y 6 fotos de tu lote en JPG, PNG o WebP, de hasta 5 MB cada una. Usa imágenes que correspondan a la cosecha ofrecida. Las fotos del catálogo son públicas.'],
    ['borrador', 'Se interrumpió la publicación, ¿perdí el lote?', 'Revisa Mis lotes. Si se alcanzó a crear un borrador, puedes editarlo y terminar la publicación desde allí. Los borradores no aparecen en el catálogo.'],
    ['visibilidad', '¿Por qué mi lote no aparece en el marketplace?', 'Revisa que esté publicado, tenga fotos y una cantidad mayor que cero. La cuenta debe estar activa y con correo confirmado. Los lotes bloqueados por un test de residuos no aparecen en el catálogo.'],
    ['retirar', '¿Cómo retiro una publicación?', 'En Mis lotes puedes editar la cantidad disponible y ponerla en cero. Si el lote ya tiene pedidos o verificaciones, se conserva su historial y no se puede eliminar.'],
    ['buscar', '¿Cómo encuentro lo que necesito?', 'En Marketplace busca el cultivo y filtra por región, precio, destino o nivel de verificación. Abre la ficha para ver la unidad del precio, la cantidad disponible y el detalle de cada verificación.'],
  ] },
  { id: 'compras', title: 'Pedidos, entregas y pagos', questions: [
    ['comprar', '¿Cómo hago un pedido?', 'Ingresa como comprador, abre una ficha y elige Comprar. Indica la cantidad y la dirección de entrega; revisa el total antes de enviar. El pedido queda pendiente hasta que el productor lo confirme.'],
    ['stock', '¿Cuándo se reserva la cantidad?', 'La cantidad se descuenta al confirmar el productor, no al enviar la solicitud. Si ya no alcanza, no podrá confirmarse. Al cancelar un pedido confirmado antes del envío, la cantidad vuelve al lote.'],
    ['seguimiento', '¿Dónde veo el estado de mi pedido?', 'En Mi panel encontrarás Mis compras o Mis ventas. Abre el pedido para consultar el seguimiento: pendiente, confirmado, enviado, recibido y calificado. También verás si fue rechazado o cancelado y su motivo.'],
    ['cancelar', '¿Puedo cancelar una compra?', 'El comprador puede cancelar mientras el pedido esté pendiente o confirmado. El productor puede rechazar una solicitud pendiente o cancelar un pedido confirmado. Cada decisión pide confirmación; después del envío, las partes deben coordinar la solución con administración.'],
    ['pagos', '¿AgroSignal cobra o procesa el pago?', 'Por ahora AgroSignal registra pedidos y entregas; no procesa cobros ni reembolsos. Coordina con la otra parte el pago y el transporte mediante los datos del pedido. El total mostrado corresponde al acuerdo de compra.'],
    ['disputas', '¿Qué ocurre si hay un desacuerdo?', 'Conserva el código del pedido y coordina con la otra parte y la administración. Un administrador puede registrar una resolución visible para ambos o cancelar un pedido que todavía esté pendiente o confirmado.'],
    ['calificar', '¿Cómo califico una compra?', 'Cuando recibas la cosecha, confirma la recepción desde el pedido. Después puedes dar de 1 a 5 estrellas y dejar un comentario. Revisa tu calificación antes de confirmarla: se conserva sin modificaciones.'],
  ] },
  { id: 'inocuidad', title: 'Sello de Inocuidad', questions: [
    ['niveles', '¿Qué significan los tres niveles?', 'El nivel 1 corresponde a un certificado aprobado y vigente; el 2, a una inspección con dron completada; y el 3, a un test de residuos con resultado Pasa. El distintivo muestra el mayor nivel disponible. Consulta también el estado individual de los tres controles en la ficha.'],
    ['documentos', '¿Cómo solicito una verificación?', 'Como productor, abre Mis lotes → Verificaciones. Puedes enviar un certificado con su vigencia y archivo, o solicitar una inspección con dron. La administración revisa los documentos y registra la evidencia de los vuelos y tests realizados.'],
    ['evidencia', '¿Quién puede ver mis documentos y evidencias?', 'Solo el productor dueño y la administración pueden abrir certificados, fotos de tests y evidencias de dron. El público ve el estado de las verificaciones. Si un enlace privado vence, actualiza la página para abrirlo nuevamente.'],
    ['test-fallido', '¿Qué pasa si un test indica No pasa?', 'El lote se bloquea y deja de aparecer en el marketplace. Se avisa al productor y a la administración, y se impiden nuevos pedidos y envíos. Registrar después un resultado Pasa no levanta el bloqueo anterior.'],
    ['exportacion', '¿El sello garantiza que puedo exportar?', 'La plataforma recomienda contar con los tres controles para lotes destinados a exportación. El distintivo describe las verificaciones registradas: no reemplaza los requisitos del destino ni un análisis de laboratorio.'],
  ] },
]

export default function HelpPage() {
  return <AppShell><div className="mb-8"><p className="mb-2 text-sm font-semibold text-[#b8860f]">Estamos para orientarte</p><h1 className="text-3xl font-extrabold text-[#1a5c2a]">Ayuda y preguntas frecuentes</h1><p className="mt-3 text-gray-600">Publica, compra y revisa tus verificaciones con información clara.</p></div>
    <nav aria-label="Temas de ayuda" className="mb-8 flex flex-wrap gap-3">{sections.map(section => <a key={section.id} href={`#${section.id}`} className="rounded-xl border border-green-700 px-4 py-3 text-sm font-semibold text-[#1a5c2a]">{section.title}</a>)}</nav>
    <div className="space-y-10">{sections.map(section => <section id={section.id} key={section.id} className="scroll-mt-6" aria-labelledby={`${section.id}-title`}><h2 id={`${section.id}-title`} className="mb-5 text-2xl font-bold text-[#1a5c2a]">{section.title}</h2><div className="grid items-start gap-4 md:grid-cols-2">{section.questions.map(([id, question, answer]) => <Card key={id}><details id={id} className="scroll-mt-6"><summary className="min-h-11 cursor-pointer py-2 font-bold text-gray-900">{question}</summary><p className="mt-4 text-sm leading-relaxed text-gray-600">{answer}</p></details></Card>)}</div></section>)}</div>
    <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-[#1a5c2a]"><Link href="/registro" className="underline">Crear cuenta</Link><Link href="/recuperar-password" className="underline">Recuperar contraseña</Link><Link href="/verificar-correo" className="underline">Confirmar correo</Link></div>
  </AppShell>
}
