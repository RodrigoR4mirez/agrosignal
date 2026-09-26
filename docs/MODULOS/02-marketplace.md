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

El catálogo incluye búsqueda, los seis filtros requeridos, paginación y estados
de carga/error/vacío. El detalle incluye galería, oferta, origen y productor.
La compra se anuncia como próxima hasta módulo 3, sin un botón no funcional.

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
La paginación de grandes catálogos no se recorrió, porque solo se generaron
dos lotes de prueba. Las compras y verificaciones documentales/dron/residuos
pertenecen a los módulos siguientes.

El aviso de rendimiento de Next.js sobre la imagen LCP detectado durante QA
se corrigió con carga `eager` para la primera foto del detalle y la primera
fila del catálogo. Se repitió catálogo/detalle a 375 y 1440 px: imágenes
cargadas, sin overflow, consola sin errores ni warnings. El build posterior
a esta corrección terminó sin errores ni warnings nuevos.
