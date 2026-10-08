'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  ['/admin', 'Resumen'], ['/admin/transacciones', 'Transacciones'], ['/admin/usuarios', 'Usuarios'],
  ['/admin/certificados', 'Certificados pendientes'], ['/admin/drones', 'Solicitudes de dron'],
  ['/admin/tests', 'Tests fallidos'], ['/admin/pedidos', 'Pedidos y disputas'],
  ['/admin/vendedores', 'Vendedores en revisión'], ['/admin/mensajes', 'Mensajes de contacto'],
]

export function AdminNav() {
  const pathname = usePathname()
  return <nav aria-label="Administración" className="grid grid-cols-2 gap-2 rounded-2xl border border-linea bg-white p-3 lg:sticky lg:top-6 lg:grid-cols-1">
    {items.map(([href, label]) => {
      const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
      return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center rounded-xl px-3 py-3 text-sm font-semibold ${active ? 'bg-petroleo text-white' : 'text-gray-600 hover:bg-crema hover:text-petroleo'}`}>{label}</Link>
    })}
  </nav>
}
