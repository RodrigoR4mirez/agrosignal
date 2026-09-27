// Nombres legibles para mostrar en la UI. Los CSVs usan identificadores sin
// tildes ni espacios ("Cafe", "Aji_Rocoto", "LaLibertad"); esto es solo para
// presentación — nunca usar el resultado para cruzar CSVs por nombre.
// Sin dependencias de Node: se importa también desde componentes cliente.

const CULTIVOS: Record<string, string> = {
  canaazucar: 'Caña de azúcar',
  platano: 'Plátano',
  maiz: 'Maíz',
  maizchoclo: 'Maíz choclo',
  pina: 'Piña',
  limon: 'Limón',
  cafe: 'Café',
  esparrago: 'Espárrago',
  arandano: 'Arándano',
  ajirocoto: 'Ají rocoto',
  palmaaceitera: 'Palma aceitera',
}

const REGIONES: Record<string, string> = {
  lalibertad: 'La Libertad',
  sanmartin: 'San Martín',
  junin: 'Junín',
  apurimac: 'Apurímac',
  huanuco: 'Huánuco',
  ancash: 'Áncash',
  madrededios: 'Madre de Dios',
}

const clave = (nombre: string) => nombre.replace(/[\s_]+/g, '').toLowerCase()

export function nombreCultivo(nombre: string): string {
  return CULTIVOS[clave(nombre)] ?? nombre.replace(/_/g, ' ')
}

export function nombreRegion(nombre: string): string {
  return REGIONES[clave(nombre)] ?? nombre.replace(/([a-z])([A-Z])/g, '$1 $2')
}
