import type { PerfilFinca } from '@/lib/perfil/types'
export type RolCalificador = 'comprador' | 'productor'
export type Distribucion = Record<'1' | '2' | '3' | '4' | '5', number>
export type Reputacion = { total: number; promedio: number | null; distribucion: Distribucion }
export type PerfilProductor = PerfilFinca & { id: string; nombre: string; region: string | null; cultivo_principal: string | null; creado_en: string; foto?: string | null; reputacion: Reputacion; ventas_completadas: number; lotes_activos: number; nivel_maximo: number; seguidores: number }
export type Resena = { id: string; productor_id: string; estrellas: number; comentario: string | null; creado_en: string; autor: string }
export type CalificacionPropia = { estrellas: number; comentario: string | null; creado_en: string; visible: boolean }
export type EstadoCalificacion = {
  rol: RolCalificador
  cierre: string | null
  habilitado: boolean
  vencido: boolean
  mia: CalificacionPropia | null
  otra_enviada: boolean
  otra: Omit<CalificacionPropia, 'visible'> | null
}
export type CalificacionAdmin = { id: string; rol_calificador: RolCalificador; estrellas: number; comentario: string | null; visible: boolean; creado_en: string }
export type VendedorEnRevision = { productor_id: string; nombre: string; telefono: string; region: string | null; suspendido: boolean; total: number; promedio: number; ultima: string }
export type CalificacionActionState = { error?: string; success?: string; revelada?: boolean }

// Menos de este número de calificaciones visibles: "Nuevo en la plataforma".
export const UMBRAL_REPUTACION = 3
export const VENTANA_DIAS = 14
export const tieneReputacion = (total: number) => total >= UMBRAL_REPUTACION

export const ETIQUETAS_ESTRELLAS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'] as const

// El campo es uno solo (estrellas + comentario); las preguntas orientan qué evaluar.
export const PREGUNTAS: Record<RolCalificador, { titulo: string; contraparte: string; preguntas: string[]; ayuda: string }> = {
  comprador: {
    titulo: '¿Cómo te fue con esta cosecha?',
    contraparte: 'productor',
    preguntas: ['¿El producto era como se describió?', '¿Llegó a tiempo?', '¿La comunicación fue buena?'],
    ayuda: 'Cuéntale al próximo comprador qué tal la calidad, el empaque y la entrega.',
  },
  productor: {
    titulo: '¿Cómo te fue con este comprador?',
    contraparte: 'comprador',
    preguntas: ['¿El pago fue puntual?', '¿Fue fácil coordinar la entrega?', '¿La comunicación fue buena?'],
    ayuda: 'Cuéntale a otros productores cómo fue el pago y la coordinación.',
  },
}

const unidades: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
export function tiempoRelativo(fecha: string, ahora = Date.now()) {
  const segundos = Math.round((new Date(fecha).getTime() - ahora) / 1000)
  const formato = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  for (const [unidad, tamano] of unidades) if (Math.abs(segundos) >= tamano) return formato.format(Math.round(segundos / tamano), unidad)
  return 'hace un momento'
}
export const fechaCorta = (fecha: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'America/Lima' }).format(new Date(fecha))
export const promedioTexto = (valor: number) => new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor)
export const calificacionesTexto = (total: number) => `${total} ${total === 1 ? 'calificación' : 'calificaciones'}`
