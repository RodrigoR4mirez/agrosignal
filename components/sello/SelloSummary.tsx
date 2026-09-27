import Link from 'next/link'
import type { SelloResumen } from '@/lib/sello/types'
import { CONTROLES } from '@/lib/marketplace/types'
import { SelloInocuidadBadge } from '@/components/SelloInocuidadBadge'

type Estado = 'ok' | 'proceso' | 'falla' | 'pendiente'
const ESTADOS: Record<string, [Estado, string]> = {
  aprobado: ['ok', 'Aprobado'], en_revision: ['proceso', 'En revisión'], rechazado: ['falla', 'Rechazado'], vencido: ['falla', 'Vencido'], sin_verificar: ['pendiente', 'Pendiente'],
  completado: ['ok', 'Completada'], solicitado: ['proceso', 'Programada'], sin_solicitar: ['pendiente', 'Pendiente'],
  pasa: ['ok', 'Aprobado'], no_pasa: ['falla', 'No aprobado'], sin_test: ['pendiente', 'Pendiente'],
}
const COLOR: Record<Estado, string> = { ok: 'text-musgo', proceso: 'text-tierra', falla: 'text-red-800', pendiente: 'text-gray-500' }

function Marca({ estado }: { estado: Estado }) {
  if (estado === 'pendiente') return <span aria-hidden="true" className="mt-0.5 size-6 shrink-0 rounded-full border-2 border-dashed border-gray-300" />
  const fondo = { ok: 'bg-musgo text-white', proceso: 'bg-arena-claro text-tierra', falla: 'bg-red-50 text-red-800' }[estado]
  return <span aria-hidden="true" className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${fondo}`}>
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {estado === 'ok' ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : estado === 'falla' ? <path d="M7 7l10 10M17 7L7 17" /> : <><circle cx="12" cy="12" r="8" strokeWidth="2.5" /><path d="M12 8v4l2.5 2" strokeWidth="2.5" /></>}
    </svg>
  </span>
}

// Resumen público de la Verificación AgroSignal: distintivo, avance y la lista de los tres controles.
export function SelloSummary({ summary, exporting }: { summary: SelloResumen; exporting: boolean }) {
  const filas = CONTROLES.map(control => ({ ...control, estado: ESTADOS[summary[control.id]] }))
  const cumplidos = filas.filter(f => f.estado[0] === 'ok').length
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <SelloInocuidadBadge nivel={summary.nivel_sello} />
      <p className="text-sm text-gray-600"><span className="font-semibold tabular-nums text-petroleo">{cumplidos} de 3</span> controles cumplidos</p>
    </div>
    <div aria-hidden="true" className="grid grid-cols-3 gap-1.5">{filas.map(f => <span key={f.id} className={`h-1.5 rounded-full ${f.estado[0] === 'ok' ? 'bg-musgo' : f.estado[0] === 'falla' ? 'bg-red-300' : 'bg-[#ebe4d4]'}`} />)}</div>
    <ol className="divide-y divide-[#f0ebdf]">{filas.map(f => <li key={f.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <Marca estado={f.estado[0]} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
          <p className="font-semibold text-petroleo">{f.titulo}</p>
          <p className={`text-sm font-semibold ${COLOR[f.estado[0]]}`}>{f.estado[1]}</p>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{f.detalle}</p>
      </div>
    </li>)}</ol>
    {exporting && cumplidos < 3 && <p className="rounded-xl bg-arena-claro p-4 text-sm leading-relaxed text-cacao">Para lotes de exportación recomendamos completar los tres controles. Consulta también los requisitos del país de destino.</p>}
    <p className="border-t border-[#f0ebdf] pt-4 text-xs leading-relaxed text-gray-500">Verificación propia de AgroSignal, no un sello oficial. El test de residuos es una prueba preliminar y no reemplaza un análisis de laboratorio. <Link href="/ayuda#niveles" className="font-semibold text-petroleo underline underline-offset-2">¿Cómo funciona?</Link></p>
  </div>
}
