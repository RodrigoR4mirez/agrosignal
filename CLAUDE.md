# AgroSignal — Contexto del proyecto

Marketplace agrícola para el Perú: productores publican lotes de cosecha y
compradores hacen pedidos, con una Verificación AgroSignal de tres niveles y panel
de administración. `/` es la landing de presentación y `/marketplace` el
catálogo de productos (búsqueda, filtros y estrellas).

> El antiguo dashboard de riesgo climático y la página de El Niño se
> eliminaron el 26 set 2026 (siguen en el historial de git, commit `6c3b055`).
> El pipeline Python de clima en iCloud (`PROYECTOS/agronomia/`) ya no
> alimenta este repo y su cron mensual quedó desactivado.

## Infraestructura

- Mac, Node.js v22, repo en iCloud: `PROYECTOS/agrosignal`
- Repo GitHub: `github.com/RodrigoR4mirez/agrosignal`
- Deploy: Vercel (`agrosignal.vercel.app`), auto-redeploy en cada push a main
- Base de datos, auth y archivos: Supabase (migraciones en `supabase/migrations/`,
  pruebas con PGlite en `supabase/tests/`, `npm run test:db`)
- Variables: ver `docs/VARIABLES-DE-ENTORNO.md` (`.env.local` no se versiona)
- iCloud a veces duplica archivos generados en `.next/types` ("… 2.ts") y
  rompe `tsc`; se borran sin problema (`rm -rf .next/types`)

## Estructura

- `app/page.tsx` — landing con estructura inspirada en tourba.ma (header propio transparente, no usa AppShell); íconos y curvas en `components/landing/Iconos.tsx`
- `app/marketplace` — catálogo de productos, ficha de lote (`[id]`) y perfil de productor (`productor/[id]`)
- `app/panel-productor`, `app/panel-comprador` — paneles por rol
- `app/admin` — usuarios, pedidos, certificados, drones, tests
- `app/verificaciones/[id]` — gestión de la Verificación AgroSignal de un lote
- `app/(auth)` — registro, login, recuperación y cuenta
- `components/AppShell.tsx` — header/footer compartidos con la identidad de la landing (logo → `/`); `anchoCompleto` para páginas con bandas a sangre (catálogo, ayuda)
- `app/marketplace/page.tsx` — cabecera petróleo con búsqueda y accesos rápidos por cultivo, filtros como opciones visibles (en escritorio se aplican al instante), chips de filtros activos; tarjeta en `components/marketplace/LotCard.tsx`
- Catálogo con scroll infinito: primera tanda de 12 en servidor, siguientes por `GET /api/marketplace`
  con cursor keyset (`components/marketplace/InfiniteCatalog.tsx`); `filtrosEfectivos` normaliza los
  filtros para que servidor y scroll usen siempre los mismos
- Catálogo al estilo tienda: banners (buscador en vidrio + ofertas), ventajas, pestañas de orden, banner intermedio y categorías; tarjeta con descuento (`precio_anterior`), estrellas y franja de vidrio con la foto del productor (`perfiles.foto`, bucket `fotos-perfil`, se sube desde el panel del productor; `components/perfil/`)
- Perfil del productor (`app/marketplace/productor/[id]`): finca, hectáreas, experiencia, altitud, ubicación GPS con mapa de OpenStreetMap, prácticas, meses de cosecha, entregas y cifras (ventas completadas, lotes activos, mejor verificación). Se edita en el panel del productor (`components/perfil/PerfilFincaForm.tsx`); columnas en `perfiles` (migración `20260927000300`)
- Comunidad (migración `20260927000400`): **favoritos** (el comprador sigue productores; RPC `seguir_productor`) y **alertas de precio** por cultivo; el trigger `avisar_lote` notifica (`referencia_tipo = 'lote'`) cuando un lote se publica o baja de precio. **Perfil del comprador** en `/compradores/[id]` (RPC `perfil_comprador`: solo él, admin o productores con pedidos suyos). **Historial de precios** en `historial_precios` (triggers al publicar/cambiar precio y al recibir un pedido) → `/marketplace/precios` y gráfico en la ficha del lote (`components/comunidad/`)
- Las pruebas QA (cultivos con "QA") también dejan filas en `historial_precios`; bórralas si aparecen en la lista de cultivos
- `app/ayuda/page.tsx` — buscador en vivo (`components/ayuda/BuscadorAyuda.tsx`), temas fijos a un lado y preguntas desplegables en una columna; `/ayuda#id` abre la pregunta
- Galería del lote (`components/marketplace/GaleriaLote.tsx`): hasta 5 fotos (`MAX_FOTOS`,
  check en la base); con varias, pila de tarjetas en abanico + miniaturas; al hacer clic, visor
  glass en `<dialog>` con zoom al punto (doble clic/toque, rueda, pellizco), arrastre, deslizar y teclado
- Pie del sitio único en `components/SitePie.tsx` (landing con `invitacion`); datos de contacto
  en `lib/contacto/types.ts` (`CONTACTO`: agrosignal@gmail.com, Lima, horario, 3RConsulting). Ciudad
  y horario son provisionales, por regularizar
- `/contacto`: formulario (`components/contacto/`) → RPC `enviar_mensaje_contacto` (tabla
  `mensajes_contacto`, límite anti-spam, aviso a los admin) + copia por correo vía FormSubmit
  (sin clave; la primera vez pide activar desde agrosignal@gmail.com; destino en `CONTACTO_CORREO`; en Vercel
  producción apunta al correo personal del dueño, que no se escribe en el repo público).
  El admin los lee en `/admin/mensajes`
- `components/calificaciones/` — estrellas, resumen de reputación y formulario de calificación
- `components/ui/Card.tsx` — Card/CardHeader/CardTitle/CardDescription
- `lib/marketplace`, `lib/transacciones`, `lib/sello`, `lib/admin`, `lib/supabase`
- Documentación por módulo en `docs/` (ver `docs/README.md`); reparto de trabajo
  por agentes en `AGENTS.md`

## Diseño

- Estética tierra con la identidad de la landing en todo el sitio (27 set 2026).
  Tokens en `app/globals.css` (`@theme`), usables como clases Tailwind:
  `bosque #133535` (= petróleo), `bosque-claro #1d4a4a`, `musgo #6f8f4e`,
  `tierra #7a4a2e`, `cacao #4a2c1d`, `arena #e6d3b3`, `arena-claro #f3e9d6`,
  fondo crema `#fdf9f0`. El antiguo verde `#1a5c2a` ya no se usa; el dorado
  `#d4a017` queda solo en las estrellas. Verde solo para avisos de éxito.
- Landing: colores adaptados de producepay.com — `petroleo #133535` (bandas
  oscuras, títulos, pie), `naranja #ee7c32` (botones, con texto petróleo por
  contraste), `trigo #f3bc48` (línea bajo títulos, "Próximamente") y
  `crema #fdf9f0` (fondos suaves), junto a la tierra.
- Landing: animación al hacer scroll con `data-revelar="subir|izquierda|derecha|linea"`
  y `components/landing/AnimacionesScroll.tsx` (fundido 1.5 s + desplazamiento;
  sin JS o con movimiento reducido todo se ve normal)
- Tipografía: Plus Jakarta Sans para todo; títulos de peso ligero (`font-normal`)
- Botones: píldora (`rounded-full`); acción principal naranja con texto petróleo
- `.leaf-texture` para franjas verde bosque con nervaduras de hoja
- Tailwind v4: degradados con `bg-linear-to-*` (**no** `bg-gradient-to-*`)
- Contenedor centrado: `.app-container` (max-width 1440px), no `max-w-[...]` suelto
- Íconos: SVG en línea (no se carga ninguna fuente de íconos)
- Fotos: solo con licencia libre verificada (Pexels, CC0, dominio público) y
  con créditos documentados; nunca imágenes generadas por IA presentadas como reales

## Verificación AgroSignal ≠ Sello BPA del SENASA

- En la interfaz el nivel se muestra como **"Verificado N/3"** con escudo (`SELLOS` y
  `CONTROLES` en `lib/marketplace/types.ts`; `components/SelloInocuidadBadge.tsx`). Los tres
  controles: Documentos revisados, Campo inspeccionado (dron) y Test de residuos; la ficha
  los lista con su estado (`components/sello/SelloSummary.tsx`).

- En la interfaz, el antiguo "Sello de Inocuidad" se llama **Verificación
  AgroSignal** (27 set 2026). En código y base de datos siguen los nombres
  `sello`, `nivel_sello`, etc.
- El **Sello BPA** es un distintivo oficial del SENASA (RD N°
  D000042-2025-MIDAGRI-SENASA-DIAIA) para predios certificados en Buenas
  Prácticas Agrícolas. AgroSignal no lo otorga: un certificado BPA vigente se
  sube como certificado `senasa` y cuenta como nivel 1.
- No usar el logo oficial del Sello BPA ni textos que sugieran aval del SENASA.

## Datos de ejemplo en producción

- 20 productores y 20 compradores con correo `*.ejemplo@example.com`, 31 lotes
  y unos 90 pedidos (72 con reseñas publicadas de ambas partes). Cada productor tiene
  perfil de finca completo y una foto referencial de Pexels (el perfil lo aclara). Los lotes llevan `descripcion` con prefijo `[Ejemplo] `
  (`MARCA_EJEMPLO` en `lib/marketplace/types.ts`): la UI los etiqueta
  "Ejemplo", muestra un aviso y no permite comprarlos.
- Carga: `scripts/cargar-ejemplos.mjs`, luego `scripts/ampliar-ejemplos.mjs`
  (perfiles, fotos, 10 lotes y reseñas), `scripts/ejemplos-comunidad.mjs` (perfil de
  los compradores, favoritos e historial de precios marcado `ejemplo`) y
  `scripts/completar-ejemplos.mjs` (foto y región de los compradores, alertas de precio y
  galerías de 5, 4 y 3 fotos en Palta Hass de Wilfredo, Palta Hass de Rosa y Papa nativa) y
  `scripts/verificaciones-ejemplo.mjs` (certificado, dron y test con evidencias que dicen
  "ejemplo": Papa nativa queda en 1/3, Maíz morado en 2/3 y el resto en 3/3) · Retiro: `scripts/limpiar-ejemplos.sql`
  (SQL Editor de Supabase) · Créditos de fotos: `docs/creditos-fotos-ejemplo.md`
- Hay además 6 cuentas QA `agrosignal.qa.…@example.com` del desarrollo que el script de
  limpieza no borra. El 27 set 2026 se les pusieron nombres y textos realistas
  (Wilfredo Quispe, Marleni Condori, Teodoro Salazar, Carmen Rosa Vílchez, Julio
  César Paredes y "Administración AgroSignal", la única cuenta admin); sus 3 lotes
  llevan `[Ejemplo] ` como el resto.
- No crear datos inventados presentados como reales: todo dato de demostración
  debe ir marcado como ejemplo.

## Convenciones para cambios en este repo

- Mantener la paleta tierra/verde/dorado en cualquier componente nuevo
- Cada landing o sub-página nueva: el logo "AgroSignal" enlaza a `/`
- Cambios de esquema: nueva migración en `supabase/migrations/` + prueba en
  `supabase/tests/`; nunca editar migraciones ya aplicadas
- Al terminar un cambio: `npm run lint`, `npm run build`, `npm run test:db`,
  luego commit + push para que Vercel redespliegue
