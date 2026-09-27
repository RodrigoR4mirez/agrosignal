# Modelo de Datos

Todas estas tablas viven en Supabase (Postgres). Esta es la referencia que
debe seguir el agente `auth-roles` (tabla 1) y cada agente correspondiente
para las demás.

## `perfiles`

Extiende la tabla de usuarios de Supabase Auth (que solo trae
correo/contraseña) con los datos propios de AgroSignal.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (FK a `auth.users`) | Igual al id del usuario en Supabase Auth |
| `nombre_completo` | text | Nombre del usuario |
| `telefono` | text | Contacto |
| `rol` | enum: `admin`, `productor`, `comprador` | Determina qué puede ver y hacer |
| `region` | text (nullable) | Solo si rol = productor |
| `cultivo_principal` | text (nullable) | Solo si rol = productor |
| `tipo_comprador` | enum: `natural`, `empresa`, `exportador` (nullable) | Solo si rol = comprador |
| `destino_exportacion` | boolean (nullable) | Solo si rol = comprador |
| `foto` | text (nullable) | Ruta `<usuario>/<uuid>.jpg` en el bucket público `fotos-perfil`. Solo el dueño la cambia (grant de columna + política `perfiles_foto_propia`); el archivo debe existir |
| `finca`, `hectareas`, `anios_experiencia`, `altitud_msnm` | text / numeric / smallint / integer (nullable) | Perfil público del productor (rangos validados en la base) |
| `latitud`, `longitud` | numeric (nullable) | Ubicación de la finca dentro del Perú; ambas o ninguna. Se muestra en un mapa |
| `sobre_mi`, `asociacion` | text (nullable) | Texto libre (600) y asociación o cooperativa |
| `practicas`, `entregas`, `meses_cosecha` | text[] / smallint[] | Listas cerradas: prácticas de cultivo, formas de entrega y meses (1–12) |
| `capacidad_mensual_kg` | numeric (nullable) | Producción aproximada por mes |
| `creado_en` | timestamp | Fecha de registro |

## `lotes`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `productor_id` | uuid (FK a `perfiles`) | Quién lo publicó |
| `cultivo` | text | Ej. "Palta Hass" |
| `region`, `provincia`, `distrito` | text | Ubicación |
| `cantidad_disponible` | numeric | Se descuenta con cada venta confirmada |
| `unidad` | enum: `kg`, `ton` | — |
| `precio_unidad` | numeric | En soles |
| `precio_anterior` | numeric (nullable) | Precio antes del descuento; siempre mayor que `precio_unidad` (hasta 20 veces). El catálogo muestra el % de rebaja y el filtro «Solo lotes con descuento» |
| `estado_cosecha` | enum: `en_cosecha`, `proxima`, `disponible` | — |
| `nivel_riesgo` | enum: `bajo`, `medio`, `alto` | Manual por ahora |
| `destino` | enum: `local`, `exportacion` | Afecta qué niveles de Sello se recomiendan |
| `descripcion` | text (nullable) | Máx. 300 caracteres |
| `fotos` | text[] | Rutas permanentes en el bucket público `fotos-lotes` |
| `bloqueado` | boolean | `true` automático si un test de residuos falla |
| `creado_en` | timestamp | — |

## `pedidos`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `comprador_id` | uuid (FK a `perfiles`) | — |
| `cantidad` | numeric | — |
| `total` | numeric | `cantidad * precio_unidad` al momento de la compra |
| `direccion_entrega` | text | — |
| `estado` | enum: `pendiente`, `confirmado`, `enviado`, `recibido`, `calificado`, `rechazado`, `cancelado` | `calificado` solo existe en pedidos anteriores al 27 set 2026 y equivale a `recibido`. Ver `docs/MODULOS/03-transacciones.md` |
| `recibido_en` | timestamp (nullable) | Cuándo pasó a `recibido`; abre la ventana de calificación de 14 días |
| `creado_en` | timestamp | — |

> Los antiguos campos `calificacion` y `comentario` de `pedidos` se
> reemplazaron por la tabla `calificaciones` (migración
> `20260927000100_calificaciones.sql`); sus datos se copiaron allí.

## `calificaciones`

Hasta 2 filas por pedido: una del comprador hacia el productor y otra del
productor hacia el comprador. Inmutables una vez enviadas.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `pedido_id` | uuid (FK a `pedidos`) | — |
| `calificado_por` | uuid (FK a `perfiles`) | Quién califica |
| `calificado_a` | uuid (FK a `perfiles`) | Quién recibe la calificación |
| `rol_calificador` | enum: `comprador`, `productor` | Para saber qué preguntas mostrar; único por pedido |
| `estrellas` | int (1-5) | — |
| `comentario` | text (nullable, hasta 1000) | — |
| `visible` | boolean | `false` hasta que ambas partes califican ("doble ciego"); ver reglas |
| `creado_en` | timestamp | — |

Lectura pública: vista `resenas_productores` (solo reseñas visibles de
compradores a productores, con el autor abreviado "Carlos H." y sin
`pedido_id`). El catálogo `catalogo_lotes` agrega `productor_calificaciones`
y `productor_promedio` (null con menos de 3 calificaciones visibles).

## `certificados` (Sello de Inocuidad — Nivel 1)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `tipo` | enum: `senasa`, `global_gap`, `otro` | — |
| `numero` | text | — |
| `fecha_vencimiento` | date | — |
| `archivo_url` | text | Ruta permanente privada del PDF o imagen en Storage |
| `estado` | enum: `en_revision`, `aprobado`, `rechazado`, `vencido` | — |
| `revisado_por` | uuid (FK a `perfiles`, nullable) | Admin que lo aprobó/rechazó |
| `motivo_rechazo` | text (nullable) | — |

## `inspecciones_dron` (Sello de Inocuidad — Nivel 2)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `estado` | enum: `solicitado`, `completado` | — |
| `coordenadas_gps` | text (nullable) | Se llena al completarse |
| `fecha_vuelo` | date (nullable) | — |
| `evidencia_urls` | text[] (nullable) | Rutas privadas de fotos/video en Storage |
| `notas` | text (nullable) | — |

## `tests_residuos` (Sello de Inocuidad — Nivel 3)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `tipo_kit` | text | Marca/tipo de tira reactiva usada |
| `fecha_prueba` | date | — |
| `resultado` | enum: `pasa`, `no_pasa` | Si es `no_pasa`, el lote se bloquea automático |
| `foto_evidencia_url` | text | Ruta privada de la foto en Storage |
| `realizado_por` | uuid (FK a `perfiles`) | — |

## `notificaciones`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `usuario_id` | uuid (FK a `perfiles`) | Quién la recibe |
| `mensaje` | text | — |
| `leida` | boolean | — |
| `referencia_tipo` | text | Ej. "pedido", "certificado" |
| `referencia_id` | uuid | — |
| `creado_en` | timestamp | — |

## Relaciones (resumen)

```
perfiles (1) ──< lotes (N)
lotes (1) ──< pedidos (N)
lotes (1) ──< certificados (N)
lotes (1) ──< inspecciones_dron (N)
lotes (1) ──< tests_residuos (N)
perfiles (1) ──< notificaciones (N)
```

## Campos y garantías incorporados en la implementación

La referencia ejecutable son las migraciones 001–007 de `supabase/migrations/`.
Se conservan las siete tablas de negocio anteriores.

| Tabla | Campos adicionales | Función |
|---|---|---|
| `perfiles` | `suspendido`; `moderacion_version`, `moderacion_motivo`, `moderacion_en`, `moderacion_por`, `moderacion_historial` | Cuenta activa y auditoría acumulativa de suspensiones/reactivaciones |
| `lotes` | `borrador` | Permite subir fotos antes de publicar; no aparece en el catálogo |
| `pedidos` | `productor_id`, nombres y teléfonos de ambas partes, `cultivo`, `unidad`, `precio_unidad` | Copia del acuerdo al comprar, independiente de ediciones posteriores del lote |
| `pedidos` | `idempotencia`, `motivo`, `actualizado_en` | Reintentos sin duplicar compras, motivo y seguimiento |
| `pedidos` | `resolucion`, `resolucion_accion`, `resolucion_estado_inicial`, `resuelto_por`, `resuelto_en`, `resolucion_idempotencia` | Resolución administrativa única e inmutable, visible a ambas partes |
| `certificados` | `creado_en`, `revisado_en` | Fecha de presentación y decisión |
| `inspecciones_dron` | `creado_en`, `completado_por`, `completado_en` | Trazabilidad de la inspección |
| `tests_residuos` | `creado_en` | Registro inmutable de la prueba |

- RLS y privilegios restringen cada tabla. Las mutaciones sensibles se hacen
  por RPC, con rol, propiedad y estado validados en la base de datos.
- Los precios se fijan en soles al crear el pedido; el total se calcula en
  PostgreSQL. El stock se descuenta al confirmar y se devuelve una sola vez
  al cancelar un pedido confirmado antes del envío, con bloqueos de filas.
- `catalogo_lotes` y `estado_sello_lote` exponen únicamente el resumen público.
  La vigencia documental se evalúa por fecha de Lima en cada lectura; no
  depende de que una tarea programada cambie el estado almacenado.
- Cualquier test `no_pasa` bloquea el lote en la misma transacción. Un test
  posterior `pasa` no borra el bloqueo. No se permite editar ni eliminar el
  resultado para reabrir el catálogo, tampoco con la clave de servicio.
- Los enlaces firmados no se guardan en tablas: se generan al consultar la
  evidencia. Los campos históricos con sufijo `_url` guardan rutas estables.
- `private.agrosignal_migrations` registra versiones y hashes técnicos; no
  es una tabla de negocio ni está expuesta a clientes públicos.

## Comunidad (migración 20260927000400)

| Tabla / columnas | Descripción |
|---|---|
| `favoritos` (`comprador_id`, `productor_id`, `creado_en`) | Productores que sigue cada comprador. Se escribe solo con el RPC `seguir_productor`; cada comprador ve solo los suyos |
| `alertas_precio` (`comprador_id`, `cultivo`, `precio_maximo_kg`) | Hasta 10 por comprador, una por cultivo. Coincide por nombre sin tildes ("palta" incluye Palta Hass) |
| `perfiles.empresa`, `rubro`, `cultivos_interes`, `volumen_mensual_kg`, `mercados_destino` | Perfil de compra. Lo ven el comprador, la administración y los productores con pedidos suyos (`perfil_comprador`) |
| `historial_precios` (`cultivo_base`, `precio_kg`, `fuente`, `ejemplo`, `registrado_en`) | Precio por kg al publicar o cambiar el precio de un lote (`publicacion`) y al recibir un pedido (`venta`). Solo se lee agregado con `historial_precio_cultivo` y `cultivos_con_precios` |
