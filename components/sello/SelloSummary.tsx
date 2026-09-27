import type { SelloResumen } from '@/lib/sello/types'
import { SelloInocuidadBadge } from '@/components/SelloInocuidadBadge'

const descriptions = {
  sin_verificar: 'Sin certificado', en_revision: 'En revisión', aprobado: 'Documento vigente aprobado', rechazado: 'Documento rechazado', vencido: 'Documento vencido',
  sin_solicitar: 'Sin inspección', solicitado: 'Inspección solicitada', completado: 'Inspección completada',
  sin_test: 'Sin test registrado', pasa: 'Pasa', no_pasa: 'No pasa · lote bloqueado',
}
export function SelloSummary({ summary, exporting }: { summary: SelloResumen; exporting: boolean }) {
  return <div className="space-y-5">
    <SelloInocuidadBadge nivel={summary.nivel_sello} />
    <dl className="grid gap-3 sm:grid-cols-3">{[
      ['Nivel 1 · Documental', descriptions[summary.documental]],
      ['Nivel 2 · Dron', descriptions[summary.dron]],
      ['Nivel 3 · Residuos', descriptions[summary.residuos]],
    ].map(([label, value]) => <div key={label} className="rounded-xl border border-gray-200 p-4"><dt className="mb-2 text-xs font-bold text-gray-600">{label}</dt><dd className="text-sm font-semibold">{value}</dd></div>)}</dl>
    {exporting && <p className="rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">Para lotes de exportación recomendamos completar los tres niveles. Consulta también los requisitos del destino de tu cosecha.</p>}
    <p className="text-xs leading-relaxed text-gray-500">Es una verificación propia de AgroSignal, no un sello oficial. Un certificado BPA del SENASA vigente cuenta como nivel 1. El test de tiras reactivas es un examen preliminar y no reemplaza un análisis de laboratorio.</p>
  </div>
}
