import type { Lote } from '@/lib/marketplace/types'

export type SelloResumen = {
  nivel_sello: 0 | 1 | 2 | 3
  documental: 'sin_verificar' | 'en_revision' | 'aprobado' | 'rechazado' | 'vencido'
  dron: 'sin_solicitar' | 'solicitado' | 'completado'
  residuos: 'sin_test' | 'pasa' | 'no_pasa'
  bloqueado: boolean
}
export type Certificado = {
  id: string
  lote_id: string
  tipo: 'senasa' | 'global_gap' | 'otro'
  numero: string
  fecha_vencimiento: string
  archivo_url: string
  estado: 'en_revision' | 'aprobado' | 'rechazado' | 'vencido'
  estado_efectivo: 'en_revision' | 'aprobado' | 'rechazado' | 'vencido'
  revisado_por: string | null
  revisado_en: string | null
  motivo_rechazo: string | null
  creado_en: string
  archivo_firmado: string | null
}
export type InspeccionDron = {
  id: string
  lote_id: string
  estado: 'solicitado' | 'completado'
  coordenadas_gps: string | null
  fecha_vuelo: string | null
  evidencia_urls: string[] | null
  notas: string | null
  creado_en: string
  completado_por: string | null
  completado_en: string | null
  evidencia_firmada: { path: string; url: string | null }[]
}
export type TestResiduos = {
  id: string
  lote_id: string
  tipo_kit: string
  fecha_prueba: string
  resultado: 'pasa' | 'no_pasa'
  foto_evidencia_url: string
  realizado_por: string
  creado_en: string
  foto_firmada: string | null
}
export type SelloManagement = {
  lote: Lote
  certificados: Certificado[]
  inspecciones: InspeccionDron[]
  tests: TestResiduos[]
  resumen: SelloResumen
}
export type SelloActionState = { error?: string; success?: string }
export function hoyLima() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
