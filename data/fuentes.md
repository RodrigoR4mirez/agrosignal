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
- **Item codes usados:** ver script. ⚠️ Corregidos en v1.3.0: Papaya 526→600, Aceituna 568→260; agregados Jengibre 720 y Aji_Rocoto 401. El pipeline valida ahora que cada código corresponda al cultivo esperado antes de guardar.

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

## Pronóstico ENSO / El Niño 2026–2027 (página `/fenomeno-nino`, fuera del pipeline)

No vive en un CSV — son constantes escritas a mano dentro de los componentes
`ProbabilidadNinoChart.tsx`, `AnomaliaSSTChart.tsx`, `MagnitudNinoChart.tsx`
(carpeta `components/`). Es una snapshot fija, no se actualiza con el cron
mensual; hay que revisar y reemplazar los valores a mano si se quiere una
versión más reciente.

### NOAA Climate Prediction Center (CPC)
- **Qué:** ENSO Diagnostic Discussion — anomalías SST actuales por región
  Niño (1+2, 3.4, 4) y probabilidad de evento "muy fuerte"
- **Emitido:** 11 jun 2026
- **URL:** `https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml`

### IRI Columbia University / NOAA CPC
- **Qué:** Probabilidad de El Niño por trimestre (JJA 2026 – FMA 2027),
  consenso de 24 modelos (15 dinámicos, 9 estadísticos)
- **Emitido:** 22 jun 2026
- **URL:** `https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/`

### ENFEN (SENAMHI/IMARPE) — Perú
- **Qué:** Magnitud prevista de El Niño Costero para Perú, verano 2026–2027
  (48% probabilidad fuerte, 46% moderado)
- **Emitido:** Comunicado Oficial N.º 11-2026, 16 jun 2026
- **URL:** `https://enfen.imarpe.gob.pe/comunicados/`

### Impacto por cultivo (análogo histórico) — sí usa datos del pipeline
`getImpactoNinoData()` en `lib/parseData.ts` reutiliza
`produccion_peru_30cultivos_historico.csv` (ya documentado arriba) para
comparar el crecimiento de producción en años El Niño (2015, 2016, 2017,
2023) contra años neutros. No agrega ningún dato nuevo — es una relectura
del CSV existente. Ver metodología completa en `CLAUDE.md`.

## Dataset alternativo (sin producción)

### perfiles_climaticos_andinos.csv
- **Qué:** Perfiles climáticos NASA POWER por región representativa para cultivos sin datos de producción en FAOSTAT
- **Cobertura:** 16 cultivos andinos/amazónicos, 2015–2026
- **Script:** `perfiles_climaticos_andinos.py`
- **Uso:** Monitoreo de anomalías climáticas en zonas productoras; no apto para modelo ML de riesgo
