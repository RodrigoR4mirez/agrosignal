# Changelog

## [1.2.0] — 2026-07-07

### Agregado
- Dashboard muestra los 30 cultivos en la tabla: 16 con predicción ML y 14 con badge **N/D** (datos insuficientes para entrenar el modelo)
- `data/fuentes.md`: trazabilidad de fuentes de datos, URLs y estado de consulta

### Corregido
- `detector_riesgo.py`: `Papaya → Loreto` faltaba en el dict de regiones — Papaya no aparecía en el dashboard aunque tenía modelo entrenado
- `detector_riesgo.py`: predicción usaba clima hardcodeado de 2024 en vez del año actual (`date.today().year`) — causaba porcentajes incorrectos para Papaya y Palma aceitera
- `detector_riesgo.py`: columna de salida `Produccion_media_ton` renombrada a `Media_historica_ton` para coincidir con la interfaz TypeScript
- `actualizar.py`: sincronizado con todos los cambios de `detector_riesgo.py` (nuevos cultivos, región Papaya, clima año actual)
- Banner del dashboard actualizado de 28 → 30 cultivos
- Entorno virtual corregido: `~/agronomia-env` → `~/proyectos/agronomia`

---

## [1.1.0] — 2026-07-07

### Agregado
- Jengibre (FAOSTAT item 720, región Junín) al pipeline ML completo
- Ají/Rocoto (FAOSTAT item 401, región Arequipa) al pipeline ML completo
- `data/perfiles_climaticos_andinos.csv`: perfiles climáticos NASA POWER para 16 cultivos andinos/amazónicos sin datos en FAOSTAT
- `perfiles_climaticos_andinos.py`: script para regenerar el dataset climático de cultivos sin producción

### Investigado y descartado (sin datos públicos estructurados)
Granadilla, Maracuyá, Chirimoya, Lúcuma, Tara, Sacha inchi, Kiwicha, Cañihua,
Olluco, Mashua, Yacón, Cúrcuma, Camu camu, Aguaje, Cocona, Achiote

### Fuentes consultadas
- FAOSTAT bulk Americas: disponible, búsqueda exhaustiva
- MINAGRI series históricas (midagri.gob.pe): URL 404
- SIEA MIDAGRI (siea.midagri.gob.pe): portal Joomla sin descargas directas

### Pendiente
- Consultar GORE Loreto y GORE Ucayali para cultivos amazónicos
- Consultar DEVIDA para cultivos en zonas VRAEM (cacao especial, etc.)

---

## [1.0.0] — 2025

### Agregado
- Pipeline Python: NASA POWER (25 regiones, 2015–2024) + FAOSTAT (28 cultivos, 1961–2024)
- Modelo Random Forest por cultivo (features: temp_media, temp_min, precipitacion_total, humedad_media)
- Dashboard Next.js 16 con Recharts, paleta verde/dorado
- Despliegue en Vercel con auto-redeploy al push en main
- Cron mensual (día 1, 8am) para actualización automática del pipeline
