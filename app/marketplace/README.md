# AgroSignal Marketplace (`/marketplace`)

Landing de marketplace implementada a partir del diseño exportado de Google
Stitch en `UX-stitch_agrosignal_marketplace/`. Ruta aislada del dashboard de
riesgo agrícola (`app/page.tsx`) — no comparte componentes ni estilos
globales más allá de la fuente Plus Jakarta Sans, que ya era global al sitio.

## Qué es

Una landing de marketing para un marketplace agrícola (venta anticipada,
transporte compartido, exportación, mapa de riesgo, comunidad), **distinta**
del dashboard de riesgo por cultivo que vive en `/`. Es contenido estático:
no está conectada a ningún backend real ni a los CSVs del pipeline agro. Los
botones "PRO", formularios y CTAs son visuales, no funcionales (igual que en
el mockup exportado).

## Decisiones de implementación

- **Una sola ruta, dos bloques.** El mockup de Stitch trae dos diseños con
  contenido *distinto* (no el mismo layout en dos anchos): un desktop de
  marketing público (`agrosignal_landing_con_acceso_pro_premium`) y un móvil
  tipo "home de app ya logueada" (`agrosignal_landing_nica_m_vil`, con bottom
  nav y KPIs personalizados). Se implementaron ambos completos y se
  intercambian por CSS: `<DesktopLanding />` (`hidden lg:block`) +
  `<MobileHome />` (`lg:hidden`) dentro de `page.tsx`.
- **Tokens propios, sin tocar el resto del sitio.** `marketplace.css` define
  las variables de color/sombra del `DESIGN.md` de Stitch bajo
  `.marketplace-scope`, y un contenedor propio `.ms-container` (1280px, el
  ancho de lienzo que usó Stitch) en vez de reusar `.app-container` del
  dashboard.
- **Material Symbols** se carga solo en `app/marketplace/layout.tsx` (no en
  el layout raíz).
- **Estructura de componentes:** `_components/desktop/`, `_components/mobile/`
  y `_components/shared/` (ícono, badge PRO). El prefijo `_` excluye la
  carpeta del router de Next.

## Bug de CSS encontrado y corregido (afecta todo el sitio)

`app/globals.css` tenía `* { margin: 0; padding: 0; box-sizing: border-box }`
escrito **fuera** de las capas (`@layer`) de Tailwind v4. En cascade layers,
una regla sin capa le gana a cualquier regla dentro de una capa sin importar
especificidad — así que esa línea anulaba silenciosamente **todas** las
utilidades de margen de Tailwind (`mt-*`, `mb-*`, `space-y-*`, etc.) en site
completo, no solo en `/marketplace`. Se detectó porque `mt-auto` no empujaba
el botón "Iniciar Sesión" al fondo del menú móvil. Se eliminó la regla
duplicada (Tailwind ya trae ese mismo reset, correctamente ubicado en su
propia capa `base`); se verificó que el dashboard en `/` sigue viéndose bien.

## Imágenes

Las fotos del export de Stitch apuntaban a URLs temporales de
`lh3.googleusercontent.com` (no son activos propios). Se descargaron y
quedan en dos lugares con roles distintos:

- `UX-stitch_agrosignal_marketplace/assets/images/` — copia de referencia
  con los nombres de archivo originales (tokens de Google), usada solo para
  actualizar las rutas `src` de los `code.html` de Stitch (documentación de
  diseño, no se sirve en la web).
- `public/marketplace/` — las mismas 19 fotos, renombradas de forma legible
  y usadas de verdad por los componentes de React vía `<img src="/marketplace/...">`.

| Archivo | Usado en |
|---|---|
| `hero-valle-sagrado.jpg` | Hero desktop (fondo) |
| `mapa-riesgo-topografico.jpg` | Mapa de Riesgo desktop |
| `transporte-camion.jpg` | Transporte desktop (camión) |
| `transporte-gps-mapa.jpg` | Transporte desktop (mini-mapa GPS) |
| `exportacion-mapa-eeuu.jpg` | Oportunidades de Exportación (mapa EE.UU.) |
| `sello-inocuidad-palta.jpg` | Sello de Inocuidad |
| `cosecha-papas.jpg` / `cosecha-mango.jpg` / `cosecha-esparrago.jpg` | Cosechas Disponibles (3 lotes) |
| `asesor-ricardo.jpg` | Asesoría Profesional |
| `testimonio-eusebio.jpg` / `testimonio-anamaria.jpg` / `testimonio-raul.jpg` | Testimonios (3) |
| `mobile-hero-campo.jpg` | Hero móvil (fondo) |
| `mobile-mapa-riesgo.png` | Mapa de Riesgos móvil |
| `lote-arandanos-aereo.jpg` / `mango-plantacion.jpg` | Tus Lotes móvil (2) |
| `noticia-mercados.jpg` / `noticia-tecnologia.jpg` | Últimas Noticias móvil (2) |

El componente `shared/PlaceholderImage.tsx` (bloques de color usados antes
de tener las fotos reales) ya no se usa y fue eliminado.

## Pendiente / decisiones abiertas

- Nada wireado a datos reales — es contenido de marketing estático.
- Si se agregan más imágenes al export de Stitch, el flujo es: descargarlas
  a `UX-stitch_agrosignal_marketplace/assets/images/`, actualizar los `src`
  de los `code.html` de referencia, copiar a `public/marketplace/` con un
  nombre legible, y apuntar el `<img>` del componente correspondiente.
