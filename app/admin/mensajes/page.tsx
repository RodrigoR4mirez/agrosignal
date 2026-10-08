import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { tituloItem } from '@/components/ui/estilos'
import { AdminHeading, QueueEmpty, adminLink } from '@/components/admin/AdminUI'
import { MarcarMensaje } from '@/components/contacto/MarcarMensaje'
import { listMensajesContacto } from '@/lib/contacto/data'
import { ASUNTOS_CONTACTO, PERFILES_CONTACTO } from '@/lib/contacto/types'

const fecha = (valor: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(valor))

export default async function MensajesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams
  const pendientes = ver !== 'todos'
  const data = await listMensajesContacto(pendientes)
  return <><AdminHeading title="Mensajes de contacto" description="Lo que llega desde el formulario Contáctanos. También se envía una copia por correo; responde desde tu correo y marca el mensaje como atendido." />
    <div className="mb-5 flex flex-wrap gap-2 text-sm font-semibold">{[['pendientes', 'Pendientes'], ['todos', 'Todos']].map(([valor, texto]) => <Link key={valor} href={`/admin/mensajes${valor === 'todos' ? '?ver=todos' : ''}`} aria-current={(valor === 'todos') === !pendientes ? 'page' : undefined} className={`rounded-full px-4 py-2 ${(valor === 'todos') === !pendientes ? 'bg-petroleo text-white' : 'text-petroleo ring-1 ring-petroleo/25 hover:bg-crema'}`}>{texto}</Link>)}</div>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>{pendientes ? 'No hay mensajes pendientes.' : 'Todavía no llegan mensajes.'}</QueueEmpty> : <div className="space-y-5">{data.items.map(m => <Card key={m.id} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className={`wrap-anywhere ${tituloItem}`}>{m.nombre}</h2><p className="text-sm text-gray-600 wrap-anywhere">{PERFILES_CONTACTO[m.perfil]} · {fecha(m.creado_en)}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${m.atendido ? 'bg-gray-100 text-gray-700' : 'bg-arena-claro text-cacao'}`}>{m.atendido ? 'Atendido' : ASUNTOS_CONTACTO[m.asunto]}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-anywhere">{m.mensaje}</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <a href={`mailto:${m.correo}?subject=${encodeURIComponent(`Re: ${ASUNTOS_CONTACTO[m.asunto]} · AgroSignal`)}`} className={adminLink}>Responder a {m.correo}</a>
        {m.telefono && <span className="text-sm text-gray-600">Tel. {m.telefono}</span>}
        <MarcarMensaje id={m.id} atendido={m.atendido} />
      </div>
    </Card>)}</div>}
  </>
}
