import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { FormularioContacto } from '@/components/contacto/FormularioContacto'
import { CurvasNivel } from '@/components/landing/Iconos'
import { CONTACTO } from '@/lib/contacto/types'

export const metadata: Metadata = { title: 'Contáctanos | AgroSignal', description: 'Escríbenos para vender tu cosecha, comprar directo del campo, verificar tus lotes o resolver dudas sobre tu cuenta.', alternates: { canonical: '/contacto' } }

const icono = 'size-5 shrink-0'
const DATOS: [React.ReactNode, string, React.ReactNode][] = [
  [<svg key="c" viewBox="0 0 24 24" aria-hidden="true" className={icono} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg>, 'Correo', <a key="a" href={`mailto:${CONTACTO.correo}`} className="underline-offset-4 hover:underline">{CONTACTO.correo}</a>],
  [<svg key="u" viewBox="0 0 24 24" aria-hidden="true" className={icono} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>, 'Oficina', CONTACTO.ciudad],
  [<svg key="h" viewBox="0 0 24 24" aria-hidden="true" className={icono} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>, 'Horario de atención', CONTACTO.horario],
]

export default function ContactoPage() {
  return <AppShell anchoCompleto>
    <section className="relative isolate overflow-hidden bg-petroleo">
      <Image src="/landing/productora-cafe.jpg" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-35" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-petroleo via-petroleo/90 to-petroleo/40" />
      <CurvasNivel className="absolute -left-32 -top-40 -z-10 w-[40rem] opacity-25" />
      <div className="app-container grid gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:px-8">
        <div className="text-white lg:sticky lg:top-28">
          <p className="text-sm font-semibold text-trigo">Contáctanos</p>
          <h1 className="mt-3 text-4xl font-light leading-tight sm:text-5xl">Conversemos sobre tu cosecha o tu próxima compra</h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/80">Ayudamos a productores a publicar y verificar sus lotes, y a compradores a encontrar cosechas confiables en todo el Perú. {CONTACTO.respuesta}</p>
          <ul className="mt-10 space-y-3">{DATOS.map(([svg, titulo, valor]) => <li key={titulo} className="flex items-center gap-4 rounded-2xl bg-white/10 px-4 py-3.5 ring-1 ring-white/15 backdrop-blur-md">
            <span className="grid size-10 place-items-center rounded-full bg-white/10 text-[#b9d99a]">{svg}</span>
            <span className="min-w-0"><span className="block text-xs text-white/60">{titulo}</span><span className="block truncate text-[15px] font-semibold">{valor}</span></span>
          </li>)}</ul>
          <p className="mt-8 text-sm text-white/70">¿Buscas una respuesta rápida? <Link href="/ayuda" className="font-semibold text-white underline underline-offset-4">Revisa la Ayuda</Link></p>
        </div>
        <div className="rounded-[28px] bg-crema/92 p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] ring-1 ring-white/60 backdrop-blur-2xl backdrop-saturate-150 sm:p-9">
          <FormularioContacto />
        </div>
      </div>
    </section>
  </AppShell>
}
