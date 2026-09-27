const NOMBRES = ['Sin verificación', 'Nivel 1 · Documental', 'Nivel 2 · Inspección con dron', 'Nivel 3 · Test de residuos']

// Distintivo de la Verificación AgroSignal: tres barras que se llenan según el nivel.
export function SelloInocuidadBadge({ nivel }: { nivel: number }) {
  const n = NOMBRES[nivel] ? nivel : 0
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${n ? 'bg-petroleo/[0.07] text-petroleo' : 'bg-gray-100 text-gray-600'}`}>
    <span aria-hidden="true" className="flex items-end gap-0.5">{[1, 2, 3].map(barra => <span key={barra} className={`w-1 rounded-full ${barra <= n ? 'bg-musgo' : 'bg-gray-300'}`} style={{ height: 5 + barra * 2 }} />)}</span>
    {NOMBRES[n]}
  </span>
}
