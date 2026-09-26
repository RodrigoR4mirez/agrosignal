import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
export default function ProducerNotFound() { return <AppShell><h1 className="mb-4 text-2xl font-bold text-[#1a5c2a]">No encontramos ese lote en tu cuenta</h1><Link href="/panel-productor/mis-lotes" className="font-semibold text-[#1a5c2a] underline">Volver a Mis lotes</Link></AppShell> }
