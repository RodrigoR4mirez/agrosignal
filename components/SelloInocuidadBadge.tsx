const badges = [
  { label: 'Sin verificación', className: 'bg-gray-100 text-gray-600' },
  { label: 'Nivel 1 · Documental', className: 'bg-green-50 text-green-900' },
  { label: 'Nivel 2 · Inspección con dron', className: 'bg-blue-50 text-blue-900' },
  { label: 'Nivel 3 · Test de residuos', className: 'bg-amber-50 text-amber-900' },
]

export function SelloInocuidadBadge({ nivel }: { nivel: number }) {
  const badge = badges[nivel] ?? badges[0]
  return <span className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${badge.className}`}>{badge.label}</span>
}
