export type Lote = {
  id: string
  productor_id: string
  cultivo: string
  region: string
  provincia: string
  distrito: string
  cantidad_disponible: number
  unidad: 'kg' | 'ton'
  precio_unidad: number
  estado_cosecha: 'en_cosecha' | 'proxima' | 'disponible'
  nivel_riesgo: 'bajo' | 'medio' | 'alto'
  destino: 'local' | 'exportacion'
  descripcion: string | null
  fotos: string[]
  bloqueado: boolean
  borrador: boolean
  creado_en: string
}
// productor_promedio es null con menos de 3 calificaciones visibles ("Nuevo en la plataforma").
export type LotePublico = Lote & { productor_nombre: string; nivel_sello: number; productor_calificaciones: number; productor_promedio: number | null }
export const REGIONES = ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali']
export const COSECHA = { disponible: 'Disponible', en_cosecha: 'En cosecha', proxima: 'Próxima cosecha' }
export const CALIFICACION_MINIMA = [['4.5', '4,5 o más'], ['4', '4 o más'], ['3', '3 o más']] as const
export const SELLOS = ['Sin verificación', 'Nivel 1 · Documental', 'Nivel 2 · Inspección con dron', 'Nivel 3 · Test de residuos']
// Lotes de ejemplo (datos de demostración): la descripción empieza con este
// marcador. La UI los etiqueta como "Ejemplo" y no permite comprarlos.
export const MARCA_EJEMPLO = '[Ejemplo] '
export const esEjemplo = (lote: Pick<Lote, 'descripcion'>) => lote.descripcion?.startsWith(MARCA_EJEMPLO) ?? false
export const descripcionVisible = (lote: Pick<Lote, 'descripcion'>) => esEjemplo(lote) ? lote.descripcion!.slice(MARCA_EJEMPLO.length) : lote.descripcion
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(value)
export const quantity = (value: number) => new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(value)
export function photoUrl(path: string) {
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/.test(path)) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos-lotes/${path}`
}
