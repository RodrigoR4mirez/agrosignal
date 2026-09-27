'use client'
import Link from 'next/link'

export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="space-y-5 rounded-2xl border border-red-100 bg-white p-6"><h1 className="text-2xl font-bold text-[#1a5c2a]">No pudimos cargar la administración</h1><p role="alert" className="text-sm text-gray-600">Intenta nuevamente en unos momentos.</p><div className="flex flex-wrap gap-4"><button onClick={reset} className="min-h-11 rounded-xl bg-[#1a5c2a] px-5 text-sm font-semibold text-white">Reintentar</button><Link href="/ayuda" className="inline-flex min-h-11 items-center font-semibold text-[#1a5c2a] underline">Ayuda</Link></div></div>
}
