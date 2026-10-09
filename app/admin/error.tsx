'use client'
import Link from 'next/link'

export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="adm-vidrio space-y-5 rounded-2xl border border-red-100 bg-white p-6"><h1 className="text-2xl font-normal sm:text-3xl text-petroleo">No pudimos cargar la administración</h1><p role="alert" className="text-sm text-gray-600">Intenta nuevamente en unos momentos.</p><div className="flex flex-wrap gap-4"><button onClick={reset} className="min-h-11 rounded-full bg-petroleo px-5 text-sm font-semibold text-white">Reintentar</button><Link href="/ayuda" className="inline-flex min-h-11 items-center font-semibold text-petroleo underline">Ayuda</Link></div></div>
}
