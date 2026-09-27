export type UserRole = 'admin' | 'productor' | 'comprador'

export type Profile = {
  id: string
  nombre_completo: string
  telefono: string
  rol: UserRole
  region: string | null
  cultivo_principal: string | null
  tipo_comprador: 'natural' | 'empresa' | 'exportador' | null
  destino_exportacion: boolean | null
  moderacion_motivo?: string | null
  suspendido: boolean
  creado_en: string
  email: string
  email_confirmed: boolean
}

export type ActionState = { error?: string; success?: string }

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin', productor: '/panel-productor', comprador: '/panel-comprador',
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador', productor: 'Productor', comprador: 'Comprador',
}

/** Only same-origin, ordinary app paths may be used after authentication. */
export function safeNext(value: string | null | undefined, fallback = '/mi-cuenta') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return fallback
  return value
}
