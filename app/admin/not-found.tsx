import Link from 'next/link'
export default function AdminNotFound() {
  return <div className="space-y-5"><h1 className="text-2xl font-bold text-[#1a5c2a]">No encontramos este registro</h1><p className="text-sm text-gray-600">Puede que el enlace haya cambiado o que el registro ya no esté disponible.</p><Link href="/admin" className="inline-flex min-h-11 items-center font-semibold text-[#1a5c2a] underline">Volver a administración</Link></div>
}
