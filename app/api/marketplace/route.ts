import { NextResponse, type NextRequest } from 'next/server'
import { decodeCatalogCursor, getCatalogPage, type Filters } from '@/lib/marketplace/data'
import { CALIFICACION_MINIMA, ORDENES } from '@/lib/marketplace/types'

const SIN_CACHE = { 'Cache-Control': 'private, no-store, max-age=0' }

function texto(params: URLSearchParams, nombre: string, maximo: number) {
  const valor = params.get(nombre)?.trim()
  if (!valor) return undefined
  if (valor.length > maximo) throw new Error('PARAMETRO_INVALIDO')
  return valor
}

function precio(params: URLSearchParams, nombre: 'minimo' | 'maximo') {
  const valor = texto(params, nombre, 24)
  if (!valor) return undefined
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0 || numero > 1_000_000_000) throw new Error('PARAMETRO_INVALIDO')
  return String(numero)
}

function leerFiltros(params: URLSearchParams): Filters {
  const filters: Filters = {
    q: texto(params, 'q', 100),
    region: texto(params, 'region', 80),
    cultivo: texto(params, 'cultivo', 100),
    minimo: precio(params, 'minimo'),
    maximo: precio(params, 'maximo'),
  }
  const destino = texto(params, 'destino', 12)
  const sello = texto(params, 'sello', 1)
  const calificacion = texto(params, 'calificacion', 3)
  const ofertas = texto(params, 'ofertas', 1)
  const orden = texto(params, 'orden', 20)
  if (destino && destino !== 'local' && destino !== 'exportacion') throw new Error('PARAMETRO_INVALIDO')
  if (sello && !/^[0-3]$/.test(sello)) throw new Error('PARAMETRO_INVALIDO')
  if (calificacion && !CALIFICACION_MINIMA.some(([value]) => value === calificacion)) throw new Error('PARAMETRO_INVALIDO')
  if (ofertas && ofertas !== '1') throw new Error('PARAMETRO_INVALIDO')
  if (orden && !ORDENES.some(([value]) => value === orden)) throw new Error('PARAMETRO_INVALIDO')
  if (destino) filters.destino = destino
  if (sello) filters.sello = sello
  if (calificacion) filters.calificacion = calificacion
  if (ofertas) filters.ofertas = ofertas
  if (orden && orden !== 'recientes') filters.orden = orden
  return filters
}

export async function GET(request: NextRequest) {
  try {
    const filters = leerFiltros(request.nextUrl.searchParams)
    const token = request.nextUrl.searchParams.get('cursor') ?? ''
    const cursor = decodeCatalogCursor(token, filters.orden)
    if (!cursor) return NextResponse.json({ error: 'El punto de continuación no es válido.' }, { status: 400, headers: SIN_CACHE })
    const page = await getCatalogPage(filters, cursor)
    return NextResponse.json(page, { headers: SIN_CACHE })
  } catch (error) {
    if (error instanceof Error && error.message === 'PARAMETRO_INVALIDO') {
      return NextResponse.json({ error: 'Uno de los filtros no es válido.' }, { status: 400, headers: SIN_CACHE })
    }
    console.error('Error al cargar la siguiente tanda del catálogo:', error)
    return NextResponse.json({ error: 'No pudimos cargar más productos. Intenta nuevamente.' }, { status: 500, headers: SIN_CACHE })
  }
}
