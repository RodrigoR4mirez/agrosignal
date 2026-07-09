## [1.4.0] — 2026-07-09

### Agregado
- Página `/fenomeno-nino`: pronóstico del fenómeno El Niño 2026–2027 con datos
  de NOAA CPC (emitido 11 jun 2026), IRI Columbia University (22 jun 2026) y
  ENFEN/SENAMHI Perú (Comunicado N.º 11-2026, 16 jun 2026). Es una snapshot
  externa fija, fuera del pipeline mensual — ver `data/fuentes.md` para el
  detalle y cómo refrescarla.
- "Impacto estimado por cultivo" dentro de esa página: análogo histórico que
  compara, con el CSV `produccion_peru_30cultivos_historico.csv` que ya existía,
  el crecimiento de cada cultivo en los años con El Niño documentado en Perú
  (2015, 2016, 2017, 2023) contra su crecimiento normal. No es un pronóstico
  ni sale del modelo Random Forest — cada cultivo queda etiquetado con
  confianza alta/media/baja según si los 4 años análogos coinciden en el
  signo del efecto (`getImpactoNinoData()` en `lib/parseData.ts`).
- Banner en la página principal enlazando a `/fenomeno-nino`.

### Corregido
- **Bug de cruce de datos:** `getImpactoNinoData()` comparaba `Cultivo` entre
  `riesgo_cosecha_actual.csv` (usa espacios: "Palma aceitera") y
  `produccion_peru_30cultivos_historico.csv` (usa guion bajo: "Palma_aceitera").
  Sin normalizar el nombre, Palma aceitera, Ají Rocoto, Caña de azúcar y Maíz
  choclo quedaban silenciosamente excluidos del análisis de impacto aunque sí
  tenían datos. Corregido normalizando ambos nombres antes de cruzar.
- Gráfico de riesgo (`RiesgoChart.tsx`): el eje X estaba fijo a 100% aunque el
  riesgo máximo real ronda 60–65%, dejando ~35% del gráfico vacío. Ahora el
  dominio se calcula dinámicamente (máximo real + 5%).
- Degradados de la interfaz no se pintaban: se usaba la clase de Tailwind v3
  `bg-gradient-to-*`, que no existe en Tailwind v4 (este proyecto corre v4) —
  la utilidad correcta es `bg-linear-to-*`. Corregido en todos los componentes.

### Cambiado
- Rediseño visual completo del dashboard (contenedor centrado 1440px,
  tipografía y espaciado consistentes, componente `Card` reutilizable,
  tarjetas KPI con altura/padding uniformes). Solo presentación, sin cambios
  de datos ni de lógica del modelo.

---

## [1.3.0] — 2026-07-08

### Corregido
- **CRÍTICO — Papaya:** código FAOSTAT 526 correspondía a Apricots (albaricoques), no a papaya. Corregido a 600 (Papayas). Se retiró del dashboard la alerta ALTO 68% generada con datos del cultivo equivocado; queda N/D hasta regenerar el pipeline.
- **CRÍTICO — Aceituna:** código FAOSTAT 568 correspondía a "Cantaloupes and other melons". Corregido a 260 (Olives). Se retiró la señal BAJO 7%, que contradecía la caída real del olivo peruano en 2024 (El Niño); queda N/D hasta regenerar.
- `actualizar.py`: diccionario CULTIVOS sincronizado con el dashboard (agrega Jengibre 720 y Aji_Rocoto 401; retira Quinua/Cebada). El cron mensual ya no eliminará cultivos publicados.
- `detector_riesgo.py`: año de predicción dinámico (estaba hardcodeado en 2024) y regiones de Papaya/Jengibre/Aji_Rocoto agregadas.
- Sesgo de medio año: el riesgo del año en curso se calculaba sumando la lluvia de enero a la fecha contra modelos entrenados con totales anuales. Ahora usa los últimos 12 meses (ventana móvil, precipitación normalizada a 365 días).
- Columna Media_historica_ton unificada a la ventana 2015–2024 para los 30 cultivos (antes mezclaba medias de 10 y 64 años en la misma tabla).

### Agregado
- Validación automática de mapeo cultivo↔ítem FAOSTAT en `actualizar.py` y `descargar_produccion_historica.py`: aborta la actualización si un código apunta a otro cultivo.
- Descargo de responsabilidad visible en el dashboard (herramienta experimental, no asesoría).
- Etiquetas de metodología precisas en la UI (ventana de entrenamiento, clima de últimos 12 meses).

### Cambiado
- Carpeta `svgs/` renombrada a `pipeline/`.
- Filas con datos del cultivo equivocado retiradas de `produccion_peru_30cultivos_historico.csv` y `clima_vs_produccion.csv` hasta regenerar con los códigos correctos.

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
