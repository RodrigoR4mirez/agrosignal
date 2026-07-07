# Fuentes de datos

## Fuentes activas

### NASA POWER
- **Qué:** Datos climáticos diarios por coordenadas (temperatura, precipitación, humedad)
- **Cobertura:** 25 regiones del Perú, 2015–2024
- **Script:** `descargar_todas_regiones.py`
- **Output:** `clima_peru_completo.csv`

### FAOSTAT — Production Americas
- **Qué:** Producción agrícola histórica en toneladas
- **Cobertura:** 30 cultivos, Perú, 1961–2024
- **URL bulk:** `https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Americas.zip`
- **Script:** `descargar_produccion_historica.py`
- **Output:** `produccion_peru_30cultivos_historico.csv`
- **Item codes usados:** ver script

## Fuentes consultadas sin resultado

### MINAGRI — Series históricas
- **URL intentada:** `https://www.midagri.gob.pe/portal/download/pdf/herramientas/organizaciones/dgpa/documentos/series_historicas.zip`
- **Estado:** HTTP 404 (julio 2026)

### SIEA MIDAGRI
- **URL:** `https://siea.midagri.gob.pe/portal/`
- **Estado:** Portal Joomla activo pero sin endpoints de descarga directa (julio 2026)

## Fuentes pendientes de consultar

- **GORE Loreto** — producción regional: Camu camu, Aguaje, Cocona
- **GORE Ucayali** — producción regional: Cocona, Achiote
- **DEVIDA** — cultivos en zonas VRAEM y selva alta
- **INEI** — censos agropecuarios (datos por hectárea, no toneladas)

## Dataset alternativo (sin producción)

### perfiles_climaticos_andinos.csv
- **Qué:** Perfiles climáticos NASA POWER por región representativa para cultivos sin datos de producción en FAOSTAT
- **Cobertura:** 16 cultivos andinos/amazónicos, 2015–2026
- **Script:** `perfiles_climaticos_andinos.py`
- **Uso:** Monitoreo de anomalías climáticas en zonas productoras; no apto para modelo ML de riesgo
