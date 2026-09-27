'use client'
import Link from 'next/link'

export default function PageError({ reset }: { reset: () => void }) {
  return <main className="app-container px-4 py-16"><h1 className="mb-4 text-2xl font-normal sm:text-3xl text-petroleo">No pudimos abrir esta página</h1><p role="alert" className="mb-6 text-sm text-gray-600">Intenta nuevamente en unos momentos.</p><div className="flex flex-wrap gap-5"><button onClick={reset} className="min-h-11 rounded-full bg-petroleo px-5 py-3 text-sm font-bold text-white">Volver a intentar</button><Link href="/ayuda" className="inline-flex min-h-11 items-center font-semibold text-petroleo underline">Consultar ayuda</Link></div></main>
}
