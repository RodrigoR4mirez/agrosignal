# AgroSignal Marketplace (`/marketplace`)

Catálogo público conectado a Supabase. El dashboard climático de `/` sigue
usando sus CSV y conserva su funcionamiento independiente.

## Rutas y componentes activos

- `/marketplace`: búsqueda por cultivo, filtros de región/cultivo/precio/
  destino/nivel de verificación, paginación de 12 lotes y estados vacíos/error.
- `/marketplace/[id]`: galería, oferta, origen, productor y nivel de verificación.
- `/panel-productor/publicar`: wizard de tres pasos con fotos en Supabase Storage.
- `/panel-productor/mis-lotes`: publicaciones, borradores, agotados y bloqueados;
  edición y eliminación de lotes propios con confirmación.
- `components/marketplace/`: tarjeta, wizard y confirmación de eliminación.
- `lib/marketplace/`: tipos, formato y consultas de datos.

Se reutilizan `AppShell`, `components/ui/Card.tsx`, `.app-container` y la paleta
verde/dorado. La ficha no presenta una compra operativa hasta el módulo 3.

## Visibilidad y fotos

El catálogo y el detalle consultan exclusivamente `catalogo_lotes`. Esta vista
aplica `private.lote_publicable` aun cuando el usuario sea dueño o administrador:
no muestra borradores, agotados, bloqueados, productores suspendidos/sin correo
verificado ni lotes con un test `no_pasa`. La gestión privada utiliza RLS y
filtra además por el productor autenticado.

Las fotos son objetos de `fotos-lotes` con rutas
`productor_uuid/lote_uuid/archivo_uuid.ext`. En `lotes.fotos` se guardan rutas
permanentes, y la UI deriva la URL pública del bucket. JPG/PNG/WebP, máximo
5 MB por archivo, de 1 a 6 fotos para publicar. No se usan fotos de Stitch
como si fueran fotos de productos reales.

Antes de subir fotos se crea un borrador con stock 0. Solo se publica después
de guardar correctamente todas las referencias. Una subida fallida deja un
borrador recuperable en Mis lotes; al editar un borrador se recuperan las fotos
ya subidas. Las fotos quitadas de un lote se limpian después de guardar; al
eliminar un lote se limpian los objetos de su carpeta. Si Storage falla, el
lote se guarda/elimina y se muestra un aviso de limpieza pendiente. Los objetos
no referenciados de intentos interrumpidos pueden requerir limpieza posterior;
no se elimina ninguna evidencia ni ningún objeto todavía referenciado.

La eliminación de un lote con pedidos o verificaciones es rechazada por sus
claves foráneas. Se informa al productor que puede poner el stock en 0.

## Diseño anterior

`_components/desktop`, `_components/mobile`, `_components/shared`,
`marketplace.css` y las imágenes locales de `public/marketplace` conservan
las referencias del landing original de Stitch. Ya no se renderizan desde
la página principal del catálogo. `/pro` conserva su landing de marketing.

El flujo de verificación documental, drones y tests se implementa en el módulo 4;
por ahora se consulta el mayor nivel ya registrado, sin exponer evidencia privada.

Estado y validación: `docs/MODULOS/02-marketplace.md`.
