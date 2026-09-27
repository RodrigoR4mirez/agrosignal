'use client'
import Link from 'next/link'
export default function BuyerError({ reset }: { reset: () => void }) {
  return <main className="app-container space-y-5 px-4 py-16"><h1 className="text-2xl font-normal sm:text-3xl text-petroleo">No pudimos cargar tus compras</h1><p className="text-sm text-gray-600">Revisa tu conexión e intenta nuevamente.</p><button onClick={reset} className="rounded-xl bg-petroleo px-5 py-3 text-sm font-bold text-white">Volver a intentar</button><Link href="/ayuda" className="block font-semibold text-petroleo underline">Ayuda y preguntas frecuentes</Link></main>
}
