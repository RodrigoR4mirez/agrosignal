import type { Profile } from '@/lib/supabase/types'
import type { Certificado, InspeccionDron, TestResiduos } from '@/lib/sello/types'
import type { EstadoPedido, Pedido } from '@/lib/transacciones/types'

export type AdminUser = Omit<Profile, 'email' | 'email_confirmed'> & {
  moderacion_version: number
  moderacion_motivo: string | null
  moderacion_en: string | null
  moderacion_por: string | null
}
export type AdminLot = {
  id: string
  cultivo: string
  productor_id: string
  productor_nombre: string
  productor_telefono: string
  region: string
  bloqueado: boolean
}
export type AdminCertificate = Certificado & { lote: AdminLot }
export type AdminDrone = InspeccionDron & { lote: AdminLot }
export type AdminFailedTest = TestResiduos & { lote: AdminLot }
export type AdminOrder = Pedido & {
  resolucion: string | null
  resolucion_accion: 'acuerdo' | 'cancelar' | null
  resolucion_estado_inicial: EstadoPedido | null
  resuelto_por: string | null
  resuelto_en: string | null
}
export type AdminMetrics = {
  lotes_activos: number
  pedidos_mes: number
  usuarios_nuevos: number
  certificados_pendientes: number
  drones_pendientes: number
  lotes_bloqueados: number
  vendedores_en_revision: number
  mes_desde: string
}
export type AdminActionState = { error?: string; success?: string }
export type AdminPage<T> = { items: T[]; count: number; page: number; error: boolean }
export type AdminUserFilters = { page?: number; rol?: 'productor' | 'comprador' | 'todos'; estado?: 'activos' | 'suspendidos' | 'todos'; q?: string }
export type AdminOrderFilters = { page?: number; estado?: EstadoPedido | 'todos'; q?: string }
