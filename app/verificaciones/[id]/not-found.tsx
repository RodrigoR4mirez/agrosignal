import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
export default function VerificationNotFound() { return <AppShell><h1 className="mb-4 text-2xl font-normal sm:text-3xl text-petroleo">No encontramos las verificaciones de este lote</h1><p className="mb-5 text-sm text-gray-600">Solo el productor dueño y la administración pueden gestionarlas.</p><Link href="/mi-cuenta" className="font-semibold text-petroleo underline">Volver a mi panel</Link></AppShell> }
