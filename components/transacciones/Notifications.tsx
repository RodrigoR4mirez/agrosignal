'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { marcarNotificacionAction } from '@/app/transacciones/actions'
import { FormMessage } from '@/components/auth/FormFields'
import { Card } from '@/components/ui/Card'
import { buttonSecondaryClass, tituloBloque } from '@/components/ui/estilos'
import type { Notificacion } from '@/lib/transacciones/types'

function NotificationItem({ notification, role }: { notification: Notificacion; role: 'productor' | 'comprador' | 'admin' }) {
  const [state, action, pending] = useActionState(marcarNotificacionAction, {})
  const base = role === 'admin' ? '/admin' : role === 'productor' ? '/panel-productor' : '/panel-comprador'
  const verification = notification.referencia_tipo === 'sello' && role !== 'comprador'
  const contacto = notification.referencia_tipo === 'contacto'
  const target = contacto ? '/admin/mensajes' : notification.referencia_tipo === 'lote' ? `/marketplace/${notification.referencia_id}` : notification.referencia_tipo === 'pedido' ? `${base}/${role === 'productor' ? 'ventas' : 'pedidos'}/${notification.referencia_id}` : verification ? `/verificaciones/${notification.referencia_id}` : base
  return <li className={`space-y-3 rounded-xl border p-4 ${notification.leida ? 'border-gray-100' : 'border-[#e2dbc9] bg-crema'}`}>
    <p className="text-sm leading-relaxed wrap-anywhere">{notification.mensaje}</p>
    <p className="text-xs text-gray-500">{new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(notification.creado_en))}</p>
    <FormMessage state={state} />
    <div className="flex flex-wrap items-center gap-4"><Link href={target} className="py-2 text-sm font-semibold text-petroleo underline">{contacto ? 'Ver mensajes' : notification.referencia_tipo === 'lote' ? 'Ver lote' : notification.referencia_tipo === 'pedido' ? 'Ver pedido' : verification ? 'Ver verificaciones' : 'Ir a mi panel'}</Link>{notification.leida ? <span className="text-xs text-gray-500">Leída</span> : <form action={action}><input type="hidden" name="notificacion_id" value={notification.id} /><button disabled={pending} className={buttonSecondaryClass}>{pending ? 'Guardando…' : 'Marcar como leída'}</button></form>}</div>
  </li>
}
export function Notifications({ notifications, unread, count, page, error, role, ordersPage = 1 }: {
  notifications: Notificacion[]; unread: number; count: number; page: number; error: boolean; role: 'productor' | 'comprador' | 'admin'; ordersPage?: number
}) {
  const base = role === 'admin' ? '/admin' : role === 'productor' ? '/panel-productor' : '/panel-comprador'
  return <Card className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className={tituloBloque}>Notificaciones</h2><span className="rounded-full bg-crema px-3 py-1 text-xs font-semibold text-petroleo">{unread} sin leer</span></div>
    {error ? <p role="alert" className="text-sm text-red-800">No pudimos cargar tus notificaciones. Intenta nuevamente.</p> : notifications.length ? <ul className="space-y-3">{notifications.map(notification => <NotificationItem key={notification.id} notification={notification} role={role} />)}</ul> : <p className="text-sm text-gray-600">Aquí aparecerán las novedades de tus pedidos y verificaciones.</p>}
    {(page > 1 || count > 12) && <nav aria-label="Páginas de notificaciones" className="flex flex-wrap items-center gap-4 text-sm">{page > 1 && <Link href={`${base}?pagina=${ordersPage}&avisos=${page - 1}`} className={buttonSecondaryClass}>Anteriores</Link>}<span>Página {page}</span>{page * 12 < count && <Link href={`${base}?pagina=${ordersPage}&avisos=${page + 1}`} className={buttonSecondaryClass}>Siguientes</Link>}</nav>}
  </Card>
}
