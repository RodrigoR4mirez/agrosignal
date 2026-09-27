// Etiquetas del perfil de finca (los valores coinciden con los checks de la migración 20260927000300).
export const PRACTICAS: Record<string, string> = {
  organico: 'Producción orgánica', riego_tecnificado: 'Riego tecnificado', comercio_justo: 'Comercio justo',
  cosecha_manual: 'Cosecha manual', trazabilidad: 'Trazabilidad por lote', manejo_integrado_plagas: 'Manejo integrado de plagas',
  agua_de_lluvia: 'Cultivo con agua de lluvia', semilla_nativa: 'Semilla nativa',
}
export const ENTREGAS: Record<string, string> = {
  recojo_en_chacra: 'Recojo en chacra', entrega_en_mercado: 'Entrega en mercado mayorista',
  puesto_en_planta: 'Puesto en planta del comprador', puesto_en_puerto: 'Puesto en puerto o aeropuerto',
}
export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']

export type PerfilFinca = {
  finca: string | null; hectareas: number | null; anios_experiencia: number | null; altitud_msnm: number | null
  latitud: number | null; longitud: number | null; sobre_mi: string | null; practicas: string[]; meses_cosecha: number[]
  capacidad_mensual_kg: number | null; entregas: string[]; asociacion: string | null
}
export const numero = (valor: number, decimales = 0) => new Intl.NumberFormat('es-PE', { maximumFractionDigits: decimales }).format(valor)
