import type { Reputacion } from '@/lib/calificaciones/types'

export type ProductorSeguido = { id: string; nombre: string; foto: string | null; finca: string | null; region: string | null; cultivo_principal: string | null; lotes_activos: number; seguido_en: string }
export type AlertaPrecio = { id: string; cultivo: string; precio_maximo_kg: number | null; creado_en: string }
export type PuntoPrecio = { mes: string; publicado: number | null; vendido: number | null; minimo: number; maximo: number; publicaciones: number; ventas: number; ejemplo: boolean }
export type PerfilComprador = {
  ejemplo?: boolean
  id: string; nombre: string; foto: string | null; region: string | null; tipo_comprador: 'natural' | 'empresa' | 'exportador' | null
  destino_exportacion: boolean | null; creado_en: string; empresa: string | null; rubro: string | null; cultivos_interes: string[]
  volumen_mensual_kg: number | null; mercados_destino: string[]; sobre_mi: string | null
  pedidos_completados: number; pedidos_totales: number; productores_distintos: number; reputacion: Reputacion
  resenas: { estrellas: number; comentario: string | null; creado_en: string; autor: string }[]
}
export const TIPO_COMPRADOR = { natural: 'Persona natural', empresa: 'Empresa', exportador: 'Exportador' }
