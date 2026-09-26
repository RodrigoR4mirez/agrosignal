'use client'
import Link from 'next/link'
export default function VerificationError({ reset }: { reset: () => void }) { return <main className="app-container space-y-5 px-4 py-16"><h1 className="text-2xl font-bold text-[#1a5c2a]">No pudimos cargar las verificaciones</h1><p className="text-sm text-gray-600">Revisa tu conexión y vuelve a intentarlo.</p><button onClick={reset} className="rounded-xl bg-[#1a5c2a] px-5 py-3 text-sm font-bold text-white">Volver a intentar</button><Link href="/ayuda" className="block font-semibold text-[#1a5c2a] underline">Ayuda y preguntas frecuentes</Link></main> }
