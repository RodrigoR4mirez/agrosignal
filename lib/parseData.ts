import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

export interface RiesgoData {
  Cultivo: string
  Region: string
  'Riesgo_%': number
  Nivel: 'ALTO' | 'MEDIO' | 'BAJO' | 'N/D'
  Media_historica_ton: number
}

export interface ProduccionData {
  Año: number
  Cultivo: string
  Toneladas: number
}

function readCSV(filename: string) {
  const filePath = path.join(process.cwd(), 'data', filename)
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = Papa.parse(content, { header: true, dynamicTyping: true, skipEmptyLines: true })
  return result.data
}

export function getRiesgoData(): RiesgoData[] {
  return readCSV('riesgo_cosecha_actual.csv') as RiesgoData[]
}

export function getProduccionData(): ProduccionData[] {
  return readCSV('produccion_peru_30cultivos_historico.csv') as ProduccionData[]
}

export interface ImpactoNinoData {
  Cultivo: string
  Region: string
  NivelActual: RiesgoData['Nivel']
  CrecNormal_pct: number
  CrecNino_pct: number
  Anomalia_pp: number
  AnomaliaMin_pp: number
  AnomaliaMax_pp: number
  N: number
  Confianza: 'alta' | 'media' | 'baja'
  ImpactoEsperado: 'ALTO' | 'MEDIO' | 'BAJO' | 'NEUTRO_POSITIVO'
}

// Años con El Niño documentado por ENFEN/NOAA que afectó al Perú:
// 2015-2016 (El Niño global fuerte), 2017 (El Niño Costero puro), 2023 (El Niño Costero moderado-fuerte).
// No incluye 1997-98/1982-83 (los más extremos) porque las prácticas agrícolas y variedades
// de ese entonces son poco comparables con las actuales.
const ANIOS_NINO_PERU = [2015, 2016, 2017, 2023]
const VENTANA_DESDE = 2010
const VENTANA_HASTA = 2024
const MIN_ANIOS_NINO = 2
const MIN_ANIOS_NORMALES = 3

function normalizarCultivo(nombre: string): string {
  return nombre.replace(/[\s_]+/g, '').toLowerCase()
}

function media(valores: number[]): number {
  return valores.reduce((a, b) => a + b, 0) / valores.length
}

/**
 * Estimación histórica-análoga del impacto de El Niño por cultivo: compara el crecimiento
 * interanual de producción (FAOSTAT) en años con El Niño documentado en Perú contra el
 * crecimiento "normal" del mismo cultivo en años neutros, dentro de la misma ventana de años
 * (así se aísla la anomalía de la tendencia propia de cada cultivo, ej. cultivos en expansión
 * como arándano). No es un pronóstico ni sale del modelo Random Forest — ver disclaimer en la UI.
 */
export function getImpactoNinoData(): ImpactoNinoData[] {
  const riesgo = getRiesgoData()
  const produccion = getProduccionData()

  const prodPorCultivo = new Map<string, Map<number, number>>()
  for (const row of produccion) {
    const key = normalizarCultivo(row.Cultivo)
    if (!prodPorCultivo.has(key)) prodPorCultivo.set(key, new Map())
    prodPorCultivo.get(key)!.set(row.Año, row.Toneladas)
  }

  const resultados: ImpactoNinoData[] = []

  for (const r of riesgo) {
    if (typeof r.Media_historica_ton !== 'number' || !isFinite(r.Media_historica_ton) || r.Media_historica_ton === 0) continue

    const serie = prodPorCultivo.get(normalizarCultivo(r.Cultivo))
    if (!serie) continue

    const crecimientos: { anio: number; pct: number }[] = []
    for (let y = VENTANA_DESDE; y <= VENTANA_HASTA; y++) {
      const actual = serie.get(y)
      const previo = serie.get(y - 1)
      if (actual == null || previo == null || previo === 0) continue
      crecimientos.push({ anio: y, pct: (100 * (actual - previo)) / previo })
    }

    const nino = crecimientos.filter(c => ANIOS_NINO_PERU.includes(c.anio))
    const normal = crecimientos.filter(c => !ANIOS_NINO_PERU.includes(c.anio))
    if (nino.length < MIN_ANIOS_NINO || normal.length < MIN_ANIOS_NORMALES) continue

    const crecNormal = media(normal.map(c => c.pct))
    const crecNino = media(nino.map(c => c.pct))
    const anomalias = nino.map(c => c.pct - crecNormal)
    const anomalia = media(anomalias)
    const anomaliaMin = Math.min(...anomalias)
    const anomaliaMax = Math.max(...anomalias)

    // Solo es "confiable" si además de tener suficientes años-evento, esos años
    // coinciden en el signo del efecto (todos negativos o todos positivos). Si el
    // rango cruza cero, los años análogos se contradicen entre sí y el promedio
    // no es una señal real — se marca 'baja' sin importar cuántos años haya.
    const signoConsistente = anomaliaMax <= 0 || anomaliaMin >= 0
    let confianza: ImpactoNinoData['Confianza'] = 'baja'
    if (signoConsistente && nino.length >= 4) confianza = 'alta'
    else if (signoConsistente && nino.length === 3) confianza = 'media'

    let impacto: ImpactoNinoData['ImpactoEsperado'] = 'NEUTRO_POSITIVO'
    if (anomalia <= -15) impacto = 'ALTO'
    else if (anomalia <= -5) impacto = 'MEDIO'
    else if (anomalia < 0) impacto = 'BAJO'

    const round1 = (n: number) => Math.round(n * 10) / 10

    resultados.push({
      Cultivo: r.Cultivo,
      Region: r.Region,
      NivelActual: r.Nivel,
      CrecNormal_pct: round1(crecNormal),
      CrecNino_pct: round1(crecNino),
      Anomalia_pp: round1(anomalia),
      AnomaliaMin_pp: round1(anomaliaMin),
      AnomaliaMax_pp: round1(anomaliaMax),
      N: nino.length,
      Confianza: confianza,
      ImpactoEsperado: impacto,
    })
  }

  return resultados.sort((a, b) => a.Anomalia_pp - b.Anomalia_pp)
}
