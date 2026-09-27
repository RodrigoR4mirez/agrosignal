import { randomUUID } from 'node:crypto'
import { Card } from '@/components/ui/Card'
import { AdminHeading, AdminPagination, QueueEmpty, adminDate } from '@/components/admin/AdminUI'
import { UserModeration } from '@/components/admin/AdminForms'
import { inputClass, buttonClass } from '@/components/auth/FormFields'
import { listAdminUsers } from '@/lib/admin/data'
import { requireRole } from '@/lib/supabase/auth'

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ pagina?: string; rol?: string; estado?: string; q?: string }> }) {
  await requireRole('admin')
  const params = await searchParams
  const rol = params.rol === 'productor' || params.rol === 'comprador' ? params.rol : 'todos'
  const estado = params.estado === 'activos' || params.estado === 'suspendidos' ? params.estado : 'todos'
  const q = (params.q ?? '').slice(0, 100)
  const data = await listAdminUsers({ page: Number(params.pagina), rol, estado, q })
  return <><AdminHeading title="Usuarios" description="Gestiona las cuentas de productores y compradores. Cada suspensión o reactivación conserva un motivo y avisa a la persona afectada." />
    <form className="mb-6 grid items-end gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-2 text-sm font-semibold" htmlFor="buscar-usuario"><span>Buscar por nombre</span><input id="buscar-usuario" name="q" defaultValue={q} maxLength={100} className={inputClass} /></label>
      <label className="space-y-2 text-sm font-semibold" htmlFor="rol"><span>Tipo de cuenta</span><select id="rol" name="rol" defaultValue={rol} className={inputClass}><option value="todos">Todos</option><option value="productor">Productores</option><option value="comprador">Compradores</option></select></label>
      <label className="space-y-2 text-sm font-semibold" htmlFor="estado-usuario"><span>Estado</span><select id="estado-usuario" name="estado" defaultValue={estado} className={inputClass}><option value="todos">Todos</option><option value="activos">Activos</option><option value="suspendidos">Suspendidos</option></select></label><button className={buttonClass}>Filtrar usuarios</button>
    </form><p className="mb-4 text-sm text-gray-600">{data.count} cuentas</p>
    {data.error || !data.items.length ? <QueueEmpty error={data.error}>No hay usuarios con estos filtros.</QueueEmpty> : <div className="grid gap-5 xl:grid-cols-2">{data.items.map(user => <Card key={user.id} className="min-w-0 space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 text-lg font-semibold wrap-anywhere">{user.nombre_completo}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.suspendido ? 'bg-red-50 text-red-900' : 'bg-crema text-petroleo'}`}>{user.suspendido ? 'Suspendido' : 'Activo'}</span></div><p className="text-sm text-gray-600">{user.rol === 'productor' ? 'Productor' : 'Comprador'} · {user.region || 'Sin región indicada'}</p><p className="text-sm text-gray-600 wrap-anywhere">Teléfono: {user.telefono || 'Sin teléfono'}</p><p className="text-xs text-gray-500">Registro: {adminDate(user.creado_en)}</p>{user.moderacion_motivo && <div className="rounded-xl bg-gray-50 p-4 text-sm"><p className="mb-2 font-semibold">Última decisión{user.moderacion_en ? ` · ${adminDate(user.moderacion_en)}` : ''}</p><p className="whitespace-pre-wrap wrap-anywhere">{user.moderacion_motivo}</p></div>}<UserModeration id={user.id} suspended={user.suspendido} version={user.moderacion_version} requestId={randomUUID()} /></Card>)}</div>}
    <AdminPagination base="/admin/usuarios" page={data.page} count={data.count} filters={{ rol, estado, q }} />
  </>
}
