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
| `estado_cosecha` | enum: `en_cosecha`, `proxima`, `disponible` | — |
| `nivel_riesgo` | enum: `bajo`, `medio`, `alto` | Manual por ahora |
| `destino` | enum: `local`, `exportacion` | Afecta qué niveles de Sello se recomiendan |
| `descripcion` | text (nullable) | Máx. 300 caracteres |
| `fotos` | text[] | URLs en Supabase Storage |
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
| `estado` | enum: `pendiente`, `confirmado`, `enviado`, `recibido`, `calificado`, `rechazado`, `cancelado` | Ver `docs/MODULOS/03-transacciones.md` |
| `calificacion` | int (1-5, nullable) | Solo si estado = calificado |
| `comentario` | text (nullable) | — |
| `creado_en` | timestamp | — |

## `certificados` (Sello de Inocuidad — Nivel 1)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `tipo` | enum: `senasa`, `global_gap`, `otro` | — |
| `numero` | text | — |
| `fecha_vencimiento` | date | — |
| `archivo_url` | text | PDF o imagen en Storage |
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
| `evidencia_urls` | text[] (nullable) | Fotos/video en Storage |
| `notas` | text (nullable) | — |

## `tests_residuos` (Sello de Inocuidad — Nivel 3)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `tipo_kit` | text | Marca/tipo de tira reactiva usada |
| `fecha_prueba` | date | — |
| `resultado` | enum: `pasa`, `no_pasa` | Si es `no_pasa`, el lote se bloquea automático |
| `foto_evidencia_url` | text | — |
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
