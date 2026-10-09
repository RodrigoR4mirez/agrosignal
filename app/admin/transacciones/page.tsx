import { AdminHeading } from '@/components/admin/AdminUI'
import { TableroVista } from '@/components/admin/tablero/TableroVista'
import { PERIODOS, getTablero, rangoDe } from '@/lib/admin/tablero'
import { requireRole } from '@/lib/supabase/auth'
import { buttonPrimaryClass, buttonSecondaryClass } from '@/components/ui/estilos'
import { cn } from '@/lib/utils'


export default async function TransaccionesPage({ searchParams }: { searchParams: Promise<{ periodo?: string; reales?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const { desde, hasta } = rangoDe(params.periodo), soloReales = params.reales === '1'
  const { tablero: t, error } = await getTablero(desde, hasta, soloReales)
  const filtros = new URLSearchParams({ periodo: params.periodo ?? '90', ...(soloReales ? { reales: '1' } : {}) })
  const fecha = (v: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${v}T12:00:00Z`))

  return <>
    <AdminHeading title="Transacciones" description="Cómo se mueve el negocio: valor transado, conversión entre fases, pedidos que necesitan atención y quién compra y vende. Importes en soles." />
    <form className="adm-vidrio mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-linea bg-white p-4">
      <label className="space-y-1.5 text-sm font-semibold"><span className="block">Periodo</span><select name="periodo" defaultValue={params.periodo ?? '90'} className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm">{PERIODOS.map(([v, texto]) => <option key={v} value={v}>{texto}</option>)}</select></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="reales" value="1" defaultChecked={soloReales} className="size-4 accent-petroleo" />Excluir datos de ejemplo</label>
      <button className={buttonPrimaryClass}>Aplicar</button>
      <a href={`/admin/transacciones/exportar?${filtros}`} className={cn(buttonSecondaryClass, 'ml-auto')}>Exportar CSV</a>
      <p className="w-full text-xs text-gray-500">Del {fecha(desde)} al {fecha(hasta)} (hora de Perú), según la fecha de creación del pedido.</p>
    </form>

    <TableroVista t={t} error={error} />
  </>
}
