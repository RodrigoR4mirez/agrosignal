# Módulo 2 — Publicación y Marketplace de Lotes

**Agente responsable:** `marketplace` (ver `/AGENTS.md`)

## Qué problema resuelve

`/marketplace` hoy es un mock estático con secciones bloqueadas "PRO"
(exportado de Stitch). Este módulo lo convierte en un marketplace real
donde los productores publican lotes de verdad, guardados en Supabase.

## Qué puede hacer cada rol

- **Productor**: publicar, editar y eliminar SOLO sus propios lotes.
- **Comprador / público sin cuenta**: ver el marketplace, buscar, filtrar.
  El botón "Comprar" solo aparece logueado como Comprador (ver Módulo 3).

## Pantallas

- `/marketplace` — grid público de lotes (reemplaza el mock actual,
  reusando el diseño/paleta ya existente, no reinventarlo).
- `/marketplace/[id]` — detalle de un lote.
- `/panel-productor/publicar` — formulario de publicación (wizard de
  pasos cortos, no un formulario largo de una sola vez).
- `/panel-productor/mis-lotes` — gestión de lotes propios.

## Reglas de negocio

- Un lote con `cantidad_disponible = 0` se marca "Agotado" y desaparece
  del marketplace público, pero sigue visible en `/panel-productor`.
- Filtros disponibles: región, cultivo, rango de precio, destino
  (local/exportación), nivel de Sello de Inocuidad alcanzado.
- Las fotos se suben a Supabase Storage, no se guardan en el repo.

## Estado

- [x] Tabla `lotes` creada en Supabase
- [x] Formulario de publicación (wizard)
- [x] Vista de marketplace pública con filtros
- [x] Vista de detalle de lote
- [x] Panel "mis lotes" para el productor
- [x] Probado con los 3 roles

## Implementación (26 de septiembre de 2026)

Migración `20260926000400_marketplace.sql` aplicada en Supabase real. La vista
`catalogo_lotes` filtra borradores, agotados, bloqueados, productores suspendidos
(o sin correo verificado) y resultados de residuos `no_pasa`, incluso para el
dueño o administrador. Expone solo el nombre del productor y el mayor nivel
de verificación existente; los workflows de verificación quedan para módulo 4.

Publicación mediante wizard de tres pasos. Se crea primero un borrador con
stock 0; luego se suben fotos al bucket `fotos-lotes` y se publica. Fotos JPG,
PNG o WebP, hasta 5 MB, de 1 a 6. Se guardan rutas permanentes con estructura
`productor_uuid/lote_uuid/archivo_uuid.ext`; la UI deriva sus URLs públicas.
Los errores de subida conservan el formulario y dejan el borrador recuperable
con sus fotos ya subidas desde Mis lotes.

El productor puede editar sus lotes y eliminar los que no tengan pedidos ni
verificaciones, mediante confirmación explícita. Al eliminar se limpian fotos;
la limpieza fallida se informa sin deshacer el cambio. Intentos interrumpidos
pueden dejar archivos no referenciados para limpieza posterior. RLS y permisos
por columna impiden cambiar dueño, bloqueo, fecha de creación o rol.

El catálogo incluye búsqueda, los seis filtros requeridos, scroll infinito y estados
de carga/error/vacío. El detalle incluye galería, oferta, origen y productor.
La compra se anuncia como próxima hasta módulo 3, sin un botón no funcional.

### Carga incremental del catálogo (27 de septiembre de 2026)

La primera tanda de 12 lotes se consulta y renderiza en el Server Component para
conservar una carga inicial rápida y HTML útil. Las siguientes tandas se obtienen
desde `GET /api/marketplace` cuando un `IntersectionObserver` se aproxima al final
del listado; su margen anticipado permite que la siguiente tanda llegue antes de
que el usuario alcance el indicador. También queda un botón «Cargar más productos»
como alternativa accesible y para navegadores sin `IntersectionObserver`.

La continuación usa un cursor keyset opaco, no offsets. El cursor conserva todos
los desempates del orden activo (fecha, precio o reputación y finalmente `id`),
incluido el caso de productores sin promedio, que se ordenan al final. El endpoint
valida longitudes, rangos y valores permitidos, fija el tamaño de tanda, consulta
un registro adicional para saber si terminó el catálogo y responde sin caché. El
cliente cancela solicitudes al desmontarse, bloquea solicitudes simultáneas y
deduplica por `id`; un fallo muestra un mensaje simple con reintento manual.

Los filtros y los cuatro órdenes continúan en la URL y cualquier `pagina` antigua
se ignora. El banner intermedio aparece después de 12 tarjetas, múltiplo de las
rejillas de 1, 2, 3 y 4 columnas, por lo que no corta una fila ni deja huecos.

Validación de implementación: `npm run test:db` — 24 pruebas correctas con
PostgreSQL embebido, incluyendo roles, borradores, fotos, privacidad, visibilidad
y bloqueo `no_pasa`. `npm run build` pasó sin errores ni warnings nuevos.
QA secuencial completada con los tres roles, publicación real con foto en
Storage e inspección responsive en 375 px y 1440 px (evidencia abajo).


## QA de navegador — 26 de septiembre de 2026

Pruebas realizadas en `http://localhost:3000` con Chromium/agent-browser,
cuentas exclusivas de QA y Supabase real, después de finalizar el módulo.

- [x] Productor publica un lote mediante los tres pasos, con 1000 kg,
  S/ 5.50 por kg, destino exportación y una foto JPG subida por el navegador.
- [x] Tabla `lotes`, vista `catalogo_lotes` y objeto en `fotos-lotes`
  corroborados con un script administrativo privado. La imagen carga desde
  Storage y el lote publicado tiene `borrador=false` y Sello nivel 0.
- [x] Campos obligatorios y precio cero bloqueados. Falta de foto y archivo
  TXT muestran validaciones simples en español, sin stack traces.
- [x] Público, comprador y administrador ven catálogo y detalle. Se probaron
  búsqueda, región, cultivo, precio mínimo/máximo, destino y nivel de sello,
  incluidos límites de precio exactos y combinaciones sin resultados.
- [x] Comprador y administrador no pueden publicar ni editar; el anónimo
  debe iniciar sesión. Un segundo productor recibe «No encontramos ese lote
  en tu cuenta» al intentar editar el lote ajeno.
- [x] Edición a stock 0 y precio S/ 6.25: queda «Agotado» en Mis lotes y se
  oculta del catálogo y detalle para el dueño, comprador y administrador,
  además del catálogo anónimo. La vista SQL también excluye el registro.
- [x] Restaurar 1000 kg y S/ 5.50 vuelve a mostrar el lote públicamente.
- [x] Eliminar un lote adicional: cancelar conserva la publicación;
  confirmar muestra «Lote eliminado correctamente». Se comprobó que tanto
  el registro como su objeto de Storage desaparecieron.
- [x] Capturas de wizard, catálogo, detalle y Mis lotes inspeccionadas a
  375 y 1440 px, sin desbordamiento horizontal ni imágenes rotas.
- [x] Sin excepciones de JavaScript ni overlays de error.

Evidencia local ignorada por Git: `.qa-artifacts/marketplace-results.json`
y capturas `.qa-artifacts/marketplace-*.png`. El lote principal de QA
`34533265-d051-479e-95b1-18bc86a522a9` queda publicado con 1000 kg a S/ 5.50
como dato de integración para el módulo de transacciones. Su descripción
indica explícitamente que es una prueba, sin cosecha real. La imagen usada
es un asset ilustrativo existente; se subió una copia real a Storage.
El lote adicional de eliminación ya no existe.

Esta QA verifica un archivo válido y rechazo por tipo, además de ausencia de
foto; no simula interrupciones de red ni agota todos los límites de archivos.
El recorrido de catálogos grandes no se probó en esa QA original, porque solo se
generaron dos lotes de prueba. Las compras y verificaciones documentales/dron/residuos
pertenecen a los módulos siguientes.

El aviso de rendimiento de Next.js sobre la imagen LCP detectado durante QA
se corrigió con carga `eager` para la primera foto del detalle y la primera
fila del catálogo. Se repitió catálogo/detalle a 375 y 1440 px: imágenes
cargadas, sin overflow, consola sin errores ni warnings. El build posterior
a esta corrección terminó sin errores ni warnings nuevos.

## QA de scroll infinito — 27 de septiembre de 2026

Validación secuencial posterior al cambio, realizada sobre el build de
producción local con Chromium/agent-browser:

- [x] `npm run lint` terminó sin errores ni warnings.
- [x] `npx next build --webpack` completó compilación, TypeScript y las 31
  páginas. El build predeterminado con Turbopack no pudo evaluarse en el
  sandbox porque su proceso interno intentó enlazar un puerto y recibió
  `EPERM`; es una restricción ambiental, no un error de compilación del código.
- [x] `npm run test:db` completó 67/67 pruebas.
- [x] A 375 px, la primera tanda mostró 12 de 33 productos, sin paginación
  visible, sin overflow horizontal y con el banner intermedio tras 12 tarjetas.
- [x] Al alcanzar el final, el catálogo llegó a 33/33 IDs únicos, sin
  duplicados, y mostró correctamente «Has visto todos los productos». En
  esta ejecución una sola llegada al final disparó las dos tandas restantes.
- [x] A 1440 px, la carga avanzó 12 → 24 → 33 productos en dos llegadas
  al final. Los 33 IDs fueron únicos, no apareció paginación ni overflow
  horizontal y el estado final mostró «Has visto todos los productos».
- [x] La geometría del DOM confirmó cuatro filas iniciales y once filas
  finales completas de tres tarjetas. El banner comienza después de la tarjeta
  12 y ocupa exactamente todo el ancho de la rejilla, sin celdas ni huecos
  artificiales.
- [x] Consola y registro de excepciones vacíos, sin overlay de Next.js,
  durante la carga inicial y las dos tandas incrementales.

Capturas locales ignoradas por Git:
`.qa-artifacts/marketplace-infinite-initial-375.png`,
`.qa-artifacts/marketplace-infinite-initial-1440.png` y
`.qa-artifacts/marketplace-infinite-final-1440.png`.
