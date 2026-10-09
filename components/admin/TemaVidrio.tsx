import { FondoFollaje } from '@/components/admin/FondoFollaje'
import '@/app/admin/tema-admin.css'

// Envoltorio del diseño "Planta tras el vidrio" (.claude/skills/diseno-panel-admin): admin, paneles de
// productor y comprador y sus vistas de gestión. Nunca en la landing ni en el marketplace.
export function TemaVidrio({ children }: { children: React.ReactNode }) {
  return <div className="tema-admin"><FondoFollaje />{children}</div>
}
