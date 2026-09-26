'use client'
export default function ProducerError({ reset }: { reset: () => void }) {
  return <main className="app-container px-4 py-16"><h1 className="mb-4 text-2xl font-bold text-[#1a5c2a]">No pudimos cargar tus lotes</h1><p className="mb-6 text-sm text-gray-600">Revisa tu conexión e intenta nuevamente.</p><button onClick={reset} className="rounded-xl bg-[#1a5c2a] px-5 py-3 text-sm font-bold text-white">Volver a intentar</button></main>
}
