'use client'
import Link from 'next/link'

export default function AuthError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6">
    <h1 className="text-xl font-bold">No pudimos cargar esta página</h1>
    <p className="my-4 text-gray-600">Comprueba tu conexión y vuelve a intentarlo. Tus datos siguen guardados.</p>
    <button onClick={reset} className="rounded-xl bg-petroleo px-5 py-3 font-semibold text-white">Volver a intentar</button><Link href="/ayuda" className="ml-4 inline-flex min-h-11 items-center font-semibold text-petroleo underline">Consultar ayuda</Link>
  </div>
}
