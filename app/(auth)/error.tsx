'use client'

export default function AuthError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-2xl border border-red-200 bg-white p-6">
    <h1 className="text-xl font-bold">No pudimos cargar esta página</h1>
    <p className="my-4 text-gray-600">Comprueba tu conexión y vuelve a intentarlo. Tus datos siguen guardados.</p>
    <button onClick={reset} className="rounded-xl bg-[#1a5c2a] px-5 py-3 font-semibold text-white">Volver a intentar</button>
  </div>
}
