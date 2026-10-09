<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AgroSignal — Instrucciones del proyecto

`AGENTS.md` es la única fuente de verdad para el contexto, las convenciones y
la organización del trabajo. Léelo antes de modificar cualquier módulo.

## Contexto del proyecto

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
- Tras cambiar `app/globals.css`, la caché de Turbopack puede servir la versión vieja en
  `npm run build` local (en iCloud no detecta el cambio): `rm -rf .next/cache/turbopack` antes
  de construir. Vercel construye limpio

## Estructura

- `app/page.tsx` — landing con estructura inspirada en tourba.ma (header propio transparente, no usa AppShell); íconos y curvas en `components/landing/Iconos.tsx`
- `app/marketplace` — catálogo de productos, ficha de lote (`[id]`) y perfil de productor (`productor/[id]`)
- `app/panel-productor`, `app/panel-comprador` — paneles por rol
- `app/admin` — transacciones (tablero de negocio + CSV), usuarios, pedidos, certificados, drones, tests, mensajes
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
- Compra en 6 fases (solicitud → acuerdo/contrapropuesta → pago directo con voucher → despacho con guía →
  recepción u observación → comprobante): `components/transacciones/PedidoDetalle.tsx`, `PasoPedido.tsx`,
  `lib/transacciones/fases.ts`, orden de compra en `/pedidos/[id]/orden`. Detalle en `docs/MODULOS/03-transacciones.md`
- Pago en línea opcional con Mercado Pago marketplace (`lib/pagos/`, `app/api/mercadopago/*`): visible solo con
  las variables `MP_*` en Vercel y el productor conectado. Ver `docs/VARIABLES-DE-ENTORNO.md`
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
- SEO: `app/robots.ts` (bloquea paneles, admin, pedidos y API) y `app/sitemap.ts` (páginas públicas +
  lotes y productores reales, se regenera cada hora; los de ejemplo quedan fuera). `metadataBase` y
  `SITE_URL` en `lib/seo.ts`; cada página pública declara su `alternates.canonical`. Ficha del lote y
  perfil del productor generan título, descripción y `og:image` propios, con `noindex` si son de
  ejemplo; las páginas de `(auth)` llevan `noindex`. Imagen al compartir por defecto en
  `app/opengraph-image.jpg`. Datos estructurados con `components/JsonLd.tsx`: `Organization` y
  `WebSite` en la landing; `Product`/`Offer` y `BreadcrumbList` en lotes reales (sin
  `aggregateRating`: las estrellas son del productor, no del lote). Google verificado en Search
  Console con `public/google80267b2f3c2a9b66.html` (no borrar)
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
- Paneles (productor, comprador, admin y precios), auditados con la skill `apple-design` (8 oct 2026,
  Fase 1) y extendido a Verificación AgroSignal, detalle del pedido, el flujo de 6 fases, publicar/editar
  lote y el formulario de compra (8 oct 2026, Fase 2). Clases en `components/ui/estilos.ts`: botones
  `buttonPrimaryClass` (naranja, uno por bloque), `buttonSecondaryClass` (contorno), `buttonDangerClass`
  y `buttonDangerSoftClass`, todos en píldora y con escala 0.97 al presionar (`buttonClass` de
  `FormFields` queda solo para auth, nunca para vistas de panel); títulos `tituloPagina` (36 px) >
  `tituloBloque` (24 px, ligero) > `tituloItem` (18 px, semibold); sin `font-bold`. Cifras con `Metrica`
  (`components/ui/Card.tsx`); cabecera con `CabeceraPanel`. Espaciado en pasos de 16 (cifras), 24
  (tarjetas) y 32 px (secciones). Líneas cálidas `border-linea`, `linea-suave` y `linea-fuerte` (no
  `gray-200` ni hexadecimales sueltos como `#ebe4d4`/`#e2dbc9`). Texto mínimo de 12 px y gris
  `gray-500` o más oscuro (nunca `text-gray-400`). Estados de pedido/avisos reutilizan `TONOS`
  (`components/transacciones/EtiquetaPedido.tsx`) en vez de colores ad hoc
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
- Despliegues: seguir `.claude/agents/deploy-devops.md`. QA reutilizable en `scripts/qa/`
  (`validar-catalogo.mjs`, `capturas.mjs`, `esperar-despliegue.sh`)

## Mapa de agentes

## Regla de oro

Un agente = una responsabilidad. Nunca mezcles lógica de auth con lógica de
marketplace en el mismo cambio. Si tu herramienta (Claude Code, Cursor)
soporta subagentes/skills nativos, créalos con estos nombres exactos. Si no
los soporta, igual trabaja en este orden, un módulo a la vez, sin saltar.

---

## Agente: `auth-roles`

**Responsabilidad:** registro, login, roles (Admin / Productor / Comprador),
protección de rutas, recuperación de contraseña.

**Puede tocar:** `app/(auth)/*`, `lib/supabase/*`, tabla `perfiles`,
middleware de protección de rutas.

**No debe tocar:** lógica de publicación de lotes, transacciones, sello de
inocuidad, panel admin — solo quién es el usuario y qué puede ver.

**Entregable de referencia:** ver `docs/MODULOS/01-autenticacion.md`.

---

## Agente: `marketplace`

**Responsabilidad:** publicación de lotes, edición, búsqueda, filtros, vista
pública del marketplace (`app/marketplace`; `app/pro` solo redirige),
subida de imágenes a Supabase Storage.

**Puede tocar:** `app/marketplace/*`, tabla `lotes`, componentes de tarjetas
de producto.

**Debe respetar:** la paleta de diseño definida arriba — el verde `#1a5c2a`
ya no se usa y el dorado `#d4a017` queda solo para estrellas — y las clases
`bg-linear-to-*` (Tailwind v4, nunca `bg-gradient-to-*`). No reinventar el sistema de diseño — reusar
`components/ui/Card.tsx` donde aplique.

**Entregable de referencia:** ver `docs/MODULOS/02-marketplace.md`.

---

## Agente: `transacciones`

**Responsabilidad:** flujo de compra, estados del pedido, descuento de
stock, notificaciones internas, calificaciones.

**Puede tocar:** tabla `pedidos`, tabla `notificaciones`, panel comprador,
panel productor (sección "mis ventas"/"mis compras").

**Entregable de referencia:** ver `docs/MODULOS/03-transacciones.md`.

---

## Agente: `sello-inocuidad`

**Responsabilidad:** los 3 niveles de verificación de un lote —
(1) documental, (2) inspección con dron, (3) tiras reactivas — y sus
badges visuales en el marketplace.

**Puede tocar:** tablas `certificados`, `inspecciones_dron`,
`tests_residuos`, componente reutilizable `<SelloInocuidadBadge />`.

**Regla de negocio crítica:** un lote con test de residuos "No pasa" se
oculta automáticamente del marketplace público — este agente es responsable
de que esa regla nunca se rompa en cambios futuros.

**Entregable de referencia:** ver `docs/MODULOS/04-sello-inocuidad.md`.

---

## Agente: `admin-panel`

**Responsabilidad:** moderación, aprobación de certificados, gestión de
solicitudes de dron, resolución de disputas de pedidos, métricas simples.

**Puede tocar:** `app/admin/*`, lectura de todas las tablas anteriores
(pero solo esas partes ya construidas por sus agentes respectivos — no
duplica su lógica, solo la consume).

**Entregable de referencia:** ver `docs/MODULOS/05-panel-admin.md`.

---

## Agente: `qa-testing`

**Responsabilidad:** se activa DESPUÉS de que otro agente termina su
módulo, nunca antes ni en paralelo. Prueba el flujo de principio a fin como
un usuario real (registro → login → publicar/comprar → verificar estados),
en local (`npm run dev`) antes de dar el módulo por cerrado.

**Checklist mínimo por módulo:**
- [ ] `npm run build` no tiene errores ni warnings nuevos.
- [ ] El flujo se probó con los 3 roles (Admin, Productor, Comprador).
- [ ] Los mensajes de error están en español simple, sin stack traces
      visibles al usuario.
- [ ] Responsive: se probó en ~375px (mobile) y ~1440px (desktop).
- [ ] El archivo `docs/MODULOS/0X-*.md` correspondiente quedó actualizado.

---

## Agente: `deploy-devops`

**Responsabilidad:** variables de entorno, conexión a Supabase, build de
producción, despliegue en Vercel.

**Puede tocar:** `.env.example`, configuración de Vercel, `next.config.ts`
solo si hace falta para producción.

**Entregable de referencia:** ver `docs/DESPLIEGUE.md`.

**Procedimiento ejecutable:** `.claude/agents/deploy-devops.md` (revisión, validaciones, migraciones,
pruebas locales y en producción con `scripts/qa/`, reversión y reporte).

---

## Orden de ejecución obligatorio

```
auth-roles → marketplace → transacciones → sello-inocuidad → admin-panel → deploy-devops
                                                                    ↑
                                                    qa-testing corre después de CADA uno
```

No construyas `transacciones` antes de que `marketplace` tenga lotes reales
en base de datos (no mock). No construyas `admin-panel` antes de que
`sello-inocuidad` tenga sus tablas, porque el panel admin depende de ellas
para la cola de aprobaciones.
