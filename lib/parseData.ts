import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'

export interface RiesgoData {
  Cultivo: string
  Region: string
  'Riesgo_%': number
  Nivel: 'ALTO' | 'MEDIO' | 'BAJO'
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
