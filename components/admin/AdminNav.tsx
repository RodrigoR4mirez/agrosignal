'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

const items = [
  ['/admin', 'Resumen'], ['/admin/transacciones', 'Transacciones'], ['/admin/usuarios', 'Usuarios'],
  ['/admin/certificados', 'Certificados pendientes'], ['/admin/drones', 'Solicitudes de dron'],
  ['/admin/tests', 'Tests fallidos'], ['/admin/pedidos', 'Pedidos y disputas'],
  ['/admin/vendedores', 'Vendedores en revisión'], ['/admin/mensajes', 'Mensajes de contacto'],
]

// En el celular, una fila de píldoras que se desplaza (llega hasta el borde de la pantalla);
// desde lg, columna fija a la izquierda.
export function AdminNav() {
  const pathname = usePathname()
  const activo = useRef<HTMLAnchorElement>(null)
  // Deja a la vista la sección actual cuando la fila se desplaza en el celular.
  useEffect(() => { activo.current?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [pathname])
  return <nav aria-label="Administración" className="adm-nav -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-linea lg:bg-white lg:p-3">
    {items.map(([href, label]) => {
      const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
      return <Link key={href} href={href} ref={active ? activo : undefined} aria-current={active ? 'page' : undefined} className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors lg:rounded-xl lg:px-3 ${active ? 'bg-petroleo text-white' : 'bg-white text-gray-700 ring-1 ring-linea hover:bg-crema hover:text-petroleo lg:bg-transparent lg:ring-0'}`}>{label}</Link>
    })}
  </nav>
}
