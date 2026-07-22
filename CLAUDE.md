# AgroSignal — Contexto del proyecto

Plataforma de inteligencia agrícola para Perú: predice riesgo de cosecha por
cultivo y región cruzando datos climáticos con producción histórica.

## Infraestructura

- Mac, Python 3.14, entorno virtual en `~/proyectos/agronomia`
- Frontend: Next.js 16 en `~/agro-dashboard` (este repo)
- Repo GitHub: `github.com/RodrigoR4mirez/agrosignal`
- Deploy: Vercel (`agrosignal.vercel.app`), auto-redeploy en cada push a main
- Datos y scripts Python viven FUERA de este repo, en iCloud:
  `/Users/s/Library/Mobile Documents/com~apple~CloudDocs/PROYECTOS/agronomia/`

## Flujo de datos (pipeline mensual)

```
actualizar.py  →  copiar_datos.sh  →  git push  →  Vercel redespliega
```

- Cron: día 1 de cada mes, 8am, corre `actualizar.py` (pipeline completo:
  clima + producción + modelo + dashboard)
- `copiar_datos.sh` copia los CSVs actualizados de iCloud a este proyecto Next.js
- Scripts (todos en la carpeta de iCloud, no en este repo):
  - `actualizar.py` — orquesta todo el pipeline
  - `descargar_todas_regiones.py` — descarga clima NASA POWER, 25 regiones
  - `descargar_produccion_historica.py` — descarga FAOSTAT
  - `cruzar_clima_produccion.py` — cruza clima + producción
  - `detector_riesgo.py` — entrena Random Forest y calcula riesgo (v1.3.0: año dinámico; el pipeline valida el mapeo FAOSTAT antes de guardar)
  - `visualizar.py` — genera 4 gráficos PNG con matplotlib/seaborn, guardados
    directo en la carpeta de iCloud (mismo lugar que los CSVs, sin subcarpeta):
    - `grafico_temperatura_regiones.png` — barras horizontales, temp. media
      2015-2024 por región
    - `grafico_lluvia_mensual.png` — líneas, precipitación mensual promedio
      (Piura, Cusco, Lima, Loreto, Arequipa, Puno)
    - `grafico_evolucion_temperatura.png` — líneas, temp. mensual Lima vs
      Cusco vs Loreto
    - `grafico_heatmap_temperatura.png` — heatmap región × mes
    - Fuente: solo usa `clima_peru_completo.csv` (no cruza con producción)

## Datasets (CSV, viven en iCloud y se copian aquí)

- `clima_peru_completo.csv` — 25 regiones, diario, NASA POWER 2015-2024
- `produccion_peru_30cultivos_historico.csv` — 28 cultivos, 1961-2024, FAOSTAT
- `clima_vs_produccion.csv` — dataset cruzado listo para ML
- `riesgo_cosecha_actual.csv` — riesgo calculado por cultivo y región

## Modelo ML

- Random Forest Classifier, uno por cultivo
- Features: `temp_media`, `temp_min`, `precipitacion_total`, `humedad_media`
- Umbral de mala cosecha: producción 15% por debajo de la media histórica
- Umbrales de riesgo: ALTO >60% · MEDIO 35-60% · BAJO <35%

## Dashboard (este repo Next.js)

- `StatsCards.tsx` — tarjetas KPI riesgo alto/medio/bajo
- `RiesgoChart.tsx` — gráfico de barras horizontal con Recharts (dominio del eje X dinámico: máximo real +5%, no fijo a 100%)
- `TablaRiesgo.tsx` — tabla detallada por cultivo
- `lib/parseData.ts` — parser de CSVs en TypeScript (incluye `getImpactoNinoData()`, ver sección El Niño abajo)
- `components/ui/Card.tsx` — Card/CardHeader/CardTitle/CardDescription reutilizables (padding 24px, título 24px)
- `components/Aviso.tsx` — disclaimer colapsable ("Ver metodología") reutilizado en ambas páginas
- Paleta: verde `#1a5c2a`, dorado `#d4a017`, degradados vía `bg-linear-to-*` (Tailwind v4 — **no** `bg-gradient-to-*`, esa clase no existe en v4 y no genera ningún `background-image`)
- Contenedor centrado: clase `.app-container` en `globals.css` (max-width 1440px), no usar `max-w-[...]` arbitrario suelto
- Stack: Next.js 16, TypeScript, Tailwind CSS v4, Recharts, Node.js v22.14

## Pronóstico El Niño 2026–2027 (página `/fenomeno-nino`)

Sección aparte del modelo de riesgo por cultivo — no usa el pipeline mensual,
son datos externos escritos a mano en los componentes. **Hay que refrescarlos
manualmente** si se quiere una versión más reciente (no se actualizan solos).

- **Componentes de datos:** `ProbabilidadNinoChart.tsx`, `AnomaliaSSTChart.tsx`,
  `MagnitudNinoChart.tsx` — cada uno tiene su constante `data` con la fuente y
  fecha de emisión en un comentario arriba.
- **Fuentes y fecha de la snapshot actual (julio 2026):**
  - NOAA Climate Prediction Center, ENSO Diagnostic Discussion — emitido 11 jun 2026
    (anomalías SST Niño 1+2/3.4/4; 63% prob. de evento "muy fuerte" nov26–ene27)
  - IRI Columbia University / NOAA CPC, consenso de 24 modelos ENSO — emitido 22 jun 2026
    (probabilidad de El Niño por trimestre, JJA26–FMA27)
  - ENFEN (SENAMHI/IMARPE), Comunicado Oficial N.º 11-2026 — emitido 16 jun 2026
    (magnitud de El Niño Costero para Perú, verano 2026–27: 48% fuerte / 46% moderado)
- **Impacto estimado por cultivo** (`getImpactoNinoData()` en `lib/parseData.ts`,
  renderizado por `ImpactoNinoChart.tsx` / `ImpactoNinoTabla.tsx`): NO es un
  pronóstico ni sale del modelo Random Forest — compara, con los datos que ya
  existen en `produccion_peru_30cultivos_historico.csv`, cuánto se desvió el
  crecimiento de cada cultivo en los años con El Niño documentado en Perú
  (2015, 2016, 2017, 2023) frente a su crecimiento normal en años neutros
  dentro de la ventana 2010–2024. Solo se marca "confianza alta" si los 4 años
  análogos coinciden en el signo del efecto; si no, "confianza baja" (no
  significa que el cultivo esté a salvo, solo que no hay patrón repetido).
  - ⚠️ **Trampa de nombres:** `riesgo_cosecha_actual.csv` usa espacios en
    `Cultivo` ("Palma aceitera", "Aji Rocoto") y `produccion_peru_30cultivos_historico.csv`
    usa guion bajo ("Palma_aceitera", "Aji_Rocoto"). Si se cruzan por nombre
    exacto, esos cultivos quedan silenciosamente excluidos. `getImpactoNinoData()`
    normaliza (`replace(/[\s_]+/g,'').toLowerCase()`) antes de unir — cualquier
    función nueva que cruce estos dos CSVs por `Cultivo` debe hacer lo mismo.

## Cultivos con datos FAOSTAT (30)

Cana_azucar, Papa, Arroz, Platano, Maiz, Palma_aceitera, Yuca, Uva, Palta,
Mandarina, Cebolla, Pina, Naranja, Maiz_choclo, Limon, Cafe, Cacao, Esparrago,
Tomate, Mango, Aceituna, Arandano, Trigo, Frijol, Haba, Camote, Alcachofa,
Papaya, Jengibre, Aji_Rocoto

## Cultivos con perfil climático NASA POWER (sin datos FAOSTAT, 16)

Dataset: `perfiles_climaticos_andinos.csv` — solo variables climáticas por región,
sin cruzar con producción. Útil para monitorear anomalías climáticas en zonas productoras.

Granadilla→Junin · Maracuya→SanMartin · Chirimoya→Cajamarca · Lucuma→LaLibertad ·
Tara→Ayacucho · Sacha_inchi→SanMartin · Kiwicha→Arequipa · Canihua→Puno ·
Olluco→Puno · Mashua→Cusco · Yacon→Cajamarca · Curcuma→SanMartin ·
Camu_camu→Loreto · Aguaje→Loreto · Cocona→Ucayali · Achiote→SanMartin

## Región principal por cultivo

Papa→Puno · Cafe→SanMartin · Cacao→SanMartin · Arroz→SanMartin ·
Maiz→LaLibertad · Maiz_choclo→Lima · Palta→LaLibertad · Esparrago→LaLibertad ·
Uva→Ica · Cebolla→Arequipa · Tomate→Lima · Mango→Piura · Aceituna→Tacna ·
Arandano→LaLibertad · Cana_azucar→LaLibertad · Platano→Loreto · Yuca→Loreto ·
Palma_aceitera→Loreto · Mandarina→Junin · Naranja→Junin · Pina→Junin ·
Limon→Piura · Camote→Lima · Trigo→Junin · Haba→Junin · Frijol→Cajamarca ·
Alcachofa→Ica · Papaya→Loreto · Jengibre→Junin · Aji_Rocoto→Arequipa

## Pendiente: agregar cultivos a la UI del dashboard

Los 2 nuevos cultivos FAOSTAT (Jengibre, Aji_Rocoto) ya están en los CSVs y el pipeline ML.
Los 16 cultivos clima-only están en `perfiles_climaticos_andinos.csv` — pendiente decidir
cómo mostrarlos en el dashboard (sección separada sin riesgo ML, solo anomalías climáticas).

## Investigación previa: 22 cultivos candidatos

Candidatos (verificar disponibilidad real en FAOSTAT antes de integrarlos,
muchos andinos como Oca/Olluco/Mashua/Yacón/Camu camu suelen venir agrupados
bajo categorías genéricas tipo "Roots and tubers, n.e.c." en vez de tener
ítem propio):

Granadilla, Maracuyá, Chirimoya, Lúcuma, Tara, Sacha inchi, Kiwicha,
Cañihua, Ají amarillo, Rocoto, Papa nativa, Olluco, Oca, Mashua,
Yacón, Jengibre, Cúrcuma, Camu camu, Aguaje, Cocona, Achiote, Caucho

Script de verificación (correr desde `~/agronomia-env` activo, con acceso a
`bulks-faostat.fao.org`):

```bash
python3 << 'EOF'
import requests, zipfile, io, pandas as pd
url = "https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Americas.zip"
r = requests.get(url, stream=True)
z = zipfile.ZipFile(io.BytesIO(r.content))
df = pd.read_csv(z.open('Production_Crops_Livestock_E_Americas_NOFLAG.csv'), encoding='latin1')
peru = df[df['Area'] == 'Peru'][['Item', 'Item Code']].drop_duplicates()
buscar = ['lucuma', 'camu', 'sacha', 'kiwicha', 'amaranth', 'ginger',
          'turmeric', 'passion', 'granadilla', 'yacon', 'olluco',
          'oca', 'mashua', 'chili', 'pepper', 'cocona', 'aguaje',
          'annatto', 'achiote', 'cherimoya', 'tara', 'rocoto']
for term in buscar:
    r2 = peru[peru['Item'].str.lower().str.contains(term, na=False)]
    if not r2.empty:
        print(r2.to_string(index=False))
EOF
```

## Flujo OBLIGATORIO: imágenes al integrar una pantalla nueva de Stitch

Cada vez que se agregue o actualice una pantalla exportada de Stitch
(`UX-stitch_agrosignal_marketplace/<pantalla>/code.html`), antes de darla por
conectada hay que seguir estos pasos — no asumir que ya se hizo, revisar
siempre el `code.html` de esa pantalla puntual:

1. **Distinguir fotos reales de íconos.** Leer el `code.html` y listar los
   `<img>` reales. Los íconos (Material Symbols), banderas y emojis NO son
   imágenes descargables — se renderizan por fuente/unicode, no se tratan
   como asset.
2. **Pedir resolución completa, no el thumbnail por defecto.** Las URLs de
   Stitch (`lh3.googleusercontent.com/aida-public/...`) devuelven por
   defecto una miniatura pequeña (ej. 512×279, pixelada al usarla como hero).
   Agregar `=s0` al final de la URL para bajar el tamaño original (en la
   práctica: 512×279 → 1408×768 con el mismo `curl`). Verificar con `file`
   que el resultado sea un JPEG válido y de tamaño razonable antes de seguir.
3. **Avisar que son imágenes generadas por IA, no fotos de stock reales.**
   El prefijo `aida-public` en la URL confirma que Stitch generó la imagen
   con IA para el mockup (no es una fotografía real). Para pantallas que
   vayan a producción, preguntar al usuario si prefiere reemplazarla por una
   foto real de banco gratuito (Unsplash/Pexels) antes de descargar nada de
   ahí — no elegir ni descargar un reemplazo sin su confirmación explícita.
4. **Guardar dos copias con nombre descriptivo (nunca el hash de Google):**
   - Referencia del diseño: `UX-stitch_agrosignal_marketplace/assets/images/<sección>/<nombre-descriptivo>.jpg`
   - Copia servida por Next.js: `public/<ruta-de-la-página>/<nombre-descriptivo>.jpg`
     (Next.js solo sirve archivos bajo `public/`, nunca los de `UX-stitch_agrosignal_marketplace/`)
5. **Conectar el componente** a la ruta local de `public/`, con `alt`
   descriptivo, respetando tamaño/posición del diseño original.
6. **Actualizar el `code.html` de referencia** para que apunte al archivo
   local relativo (`../assets/images/<sección>/...`) en vez de la URL de
   Google, que puede caducar.
7. **Confirmar que la fuente Material Symbols Outlined esté enlazada** en el
   `layout.tsx` de esa sección (o agregarla si falta) — sin eso los íconos
   no se ven aunque el resto cargue bien.
8. **Verificar en el navegador:** Network debe mostrar la imagen cargando
   desde `localhost` y cero peticiones a `googleusercontent.com`. Revisar
   mobile (~375px) y desktop (~1440px).

## Flujo OBLIGATORIO: navegación al agregar un landing nuevo

`/marketplace` es el landing principal — cualquier landing nuevo que se
agregue (como `/pro`) es una sub-página colgando de él. Por eso, cada vez que
se cree un landing nuevo, el nombre/logo "AgroSignal" de su header debe ser
un link que regrese a `/marketplace` (ver `app/pro/_components/Nav.tsx` como
ejemplo: el logo está envuelto en `<Link href="/marketplace">`). No dejarlo
como texto suelto ni como link a `#` o a sí mismo.

## Convenciones para cambios en este repo

- Mantener la paleta verde/dorado existente en cualquier componente nuevo
- Los nuevos cultivos solo se agregan al dashboard después de confirmarse en
  el CSV cruzado `clima_vs_produccion.csv` (no antes)
- Cualquier cambio en `lib/parseData.ts` debe seguir soportando los CSVs
  actuales sin romper columnas existentes
- Al terminar un cambio: build local (`npm run dev`), luego commit + push
  para que Vercel redespliegue
