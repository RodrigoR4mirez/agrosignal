'use client'
import Link from 'next/link'
export default function ProducerError({ reset }: { reset: () => void }) {
  return <main className="app-container px-4 py-16"><h1 className="mb-4 text-2xl font-normal sm:text-3xl text-petroleo">No pudimos cargar tu panel</h1><p className="mb-6 text-sm text-gray-600">Revisa tu conexión e intenta nuevamente.</p><button onClick={reset} className="rounded-xl bg-petroleo px-5 py-3 text-sm font-bold text-white">Volver a intentar</button><Link href="/ayuda" className="ml-4 inline-flex min-h-11 items-center font-semibold text-petroleo underline">Consultar ayuda</Link></main>
}
