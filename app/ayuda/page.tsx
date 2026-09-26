import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card } from '@/components/ui/Card'

const questions = [
  ['crear-cuenta', '¿Cómo creo una cuenta?', 'Elige Crear cuenta, indica si eres productor o comprador y completa los tres pasos. Confirma el correo con el enlace que recibirás antes de publicar o comprar.'],
  ['correo', 'No recibí el correo de verificación', 'Revisa spam y comprueba que escribiste bien tu correo. En la pantalla Confirma tu correo puedes pedir otro enlace. Espera unos minutos entre intentos. Si el servicio de correo no está disponible, vuelve a intentarlo más tarde.'],
  ['password', 'Olvidé mi contraseña', 'En Ingresar elige Olvidé mi contraseña. Te enviaremos un enlace para crear una nueva. Por tu seguridad, no indicamos si un correo está registrado.'],
  ['roles', '¿Qué diferencia hay entre los tipos de cuenta?', 'Los productores publican y gestionan sus cosechas. Los compradores consultan productos y gestionan sus pedidos. Las cuentas de administración son asignadas por el equipo de AgroSignal.'],
  ['cuenta-suspendida', '¿Qué hago si mi cuenta está suspendida?', 'Una cuenta suspendida conserva sus datos y puede navegar el catálogo público, pero no puede publicar ni comprar. La revisión y reactivación corresponden al equipo administrador.'],
  ['seguridad', '¿Cómo protejo mi cuenta?', 'Usa una contraseña de al menos 10 caracteres con letras y números. Evita reutilizarla y cierra sesión en equipos compartidos. Nunca compartas tu contraseña ni tus enlaces de acceso.'],
]

export default function HelpPage() {
  return <AppShell><div className="mb-8"><p className="mb-2 text-sm font-semibold text-[#b8860f]">Estamos para orientarte</p><h1 className="text-3xl font-extrabold text-[#1a5c2a]">Ayuda y preguntas frecuentes</h1><p className="mt-3 text-gray-600">Encuentra respuestas sobre tu cuenta y cómo empezar.</p></div>
    <div className="grid gap-4 md:grid-cols-2">{questions.map(([id, question, answer]) => <Card key={id}><details id={id}><summary className="cursor-pointer font-bold text-gray-900">{question}</summary><p className="mt-4 text-sm leading-relaxed text-gray-600">{answer}</p></details></Card>)}</div>
    <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-[#1a5c2a]"><Link href="/registro" className="underline">Crear cuenta</Link><Link href="/recuperar-password" className="underline">Recuperar contraseña</Link><Link href="/verificar-correo" className="underline">Confirmar correo</Link></div>
  </AppShell>
}
