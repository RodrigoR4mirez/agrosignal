# Módulo 3 — Transacciones

**Agente responsable:** `transacciones` (ver `/AGENTS.md`)

## Qué problema resuelve

Convierte el marketplace de "catálogo" a "negocio real": un comprador
puede comprar un lote y queda un pedido rastreable, con notificaciones
para ambas partes.

## Flujo completo

```
Comprador presiona "Comprar"
  → formulario: cantidad + dirección de entrega
  → se crea pedido en estado "pendiente"
  → Productor ve el pedido, Acepta o Rechaza
      → Acepta → estado "confirmado" (se descuenta stock del lote AQUÍ,
                  no antes, para no bloquear stock con pedidos que el
                  productor podría rechazar)
      → Rechaza → estado "rechazado"
  → Productor marca "Enviado" → estado "enviado"
  → Comprador marca "Recibido" → estado "recibido"
  → Se pide calificación (1-5 estrellas + comentario opcional)
      → estado "calificado"
```

## Reglas de negocio

- Nombres de estado exactos a usar en base de datos e interfaz:
  `pendiente`, `confirmado`, `enviado`, `recibido`, `calificado`,
  `rechazado`, `cancelado`.
- El stock del lote se descuenta solo al pasar a `confirmado`.
- Cada cambio de estado dispara una notificación interna (tabla
  `notificaciones`) para ambas partes.
- No hay pasarela de pago real en este módulo (fase 2, ver
  `docs/MODULOS/03-transacciones.md` → sección "Fase 2" abajo).

## Fase 2 (no construir todavía, solo dejar la puerta abierta)

- Integrar Mercado Pago o Culqi para cobro real al confirmar el pedido.
- El campo `total` de `pedidos` ya está listo para usarse como monto a
  cobrar cuando se integre.

## Implementación

La migración `20260926000500_transacciones.sql` amplía las tablas ya creadas
con una copia del acuerdo: cultivo, unidad, precio, nombre y teléfono de
ambas partes. El comprador y el productor conservan su historial aunque
el lote se agote, quede oculto o cambie de precio. Estos datos de contacto
solo se leen dentro de los pedidos privados; no se amplía el catálogo ni
la lectura pública de perfiles.

Las escrituras usan exclusivamente RPC autenticadas, `SECURITY DEFINER`
con `search_path` vacío y autorización por identidad, rol y propiedad:

- `crear_pedido`: solo compradores activos con correo verificado. Lee el
  precio en la base de datos, verifica el precio mostrado en el formulario,
  redondea el total a dos decimales y guarda una clave de idempotencia por
  comprador. Reenviar el mismo formulario devuelve el mismo pedido; cambiar
  sus datos con la misma clave se rechaza. No reserva ni descuenta stock.
- `cambiar_estado_pedido`: el productor acepta/rechaza y marca enviado; el
  comprador marca recibido y califica. Aceptar bloquea la fila del pedido
  y del lote, revalida su disponibilidad y descuenta stock atómicamente.
  Reintentar un cambio ya aplicado no vuelve a descontar ni notificar.
- `marcar_notificacion_leida`: solo permite marcar una notificación propia,
  sin editar su mensaje ni destinatario.

Cada creación y transición inserta dos notificaciones, una para cada
parte, en la misma transacción. Una calificación solo se registra después
de recibir el pedido, admite 1–5 estrellas y hasta 1000 caracteres de
comentario, y queda inmutable.

### Cancelaciones y cambios del lote

Cualquiera de las partes puede cancelar antes del envío, indicando un
motivo. Rechazar corresponde al productor y solo se permite mientras está
pendiente. Una cancelación devuelve stock exclusivamente si el pedido
estaba confirmado; el bloqueo de filas impide devolverlo dos veces. No
se vuelve a publicar un lote bloqueado ni se elimina una restricción de
inocuidad al devolver stock.

La RPC admite también cancelación administrativa con las mismas reglas
para su uso futuro por el módulo 5. No se habilitan cancelaciones después
del envío ni se construye el panel admin en este módulo.

Mientras haya pedidos pendientes, confirmados o enviados no se puede
cambiar el cultivo o la unidad del lote: una devolución debe conservar
la misma unidad. Los cambios de precio no alteran acuerdos existentes.

### Límites y validación

La cantidad admite hasta 3 decimales y 99,999,999,999.999 unidades. El
precio admite hasta 2 decimales. El total calculado debe estar entre
S/ 0.01 y S/ 999,999,999,999.99. Se rechazan valores no finitos, exceso de
precisión, cantidades que superan el stock y direcciones fuera de
8–500 caracteres. Los rechazos y cancelaciones requieren un motivo de
3–1000 caracteres; el formulario puede aplicar límites más ajustados.

Las acciones de `app/transacciones/actions.ts` vuelven a comprobar
`requireRole`, validan el formulario y exponen errores en español. No
utilizan la clave de servicio. `lib/transacciones/data.ts` pagina pedidos
y notificaciones con 12 filas por página, siempre con la sesión y RLS.

## Verificación técnica

- `npm run test:db`: **33/33 pruebas correctas** (26 de septiembre de 2026).
  La suite de transacciones ejecuta las cinco migraciones completas en
  PostgreSQL mediante PGlite: roles y RLS, siete estados, precio/total,
  idempotencia, límites numéricos, aceptación y reversión del stock,
  snapshots, ocultación por residuos y privacidad de notificaciones.
- Se probaron dos pedidos pendientes que compiten por el mismo stock y el
  rechazo de la segunda aceptación. PGlite ejecuta las consultas en una
  conexión; esta prueba no simula concurrencia de múltiples conexiones.
  La serialización en producción se implementa con bloqueos de filas y
  una transacción por RPC.
- `npx tsc --noEmit`: correcto durante la integración del módulo.
- Migración 005 aplicada en Supabase remoto; `npm run build` final pasó
  sin errores ni warnings nuevos tras integrar la UI y el mensaje de
  protección de unidad/cultivo (26 de septiembre de 2026).

## Estado

- [x] Tabla `pedidos` creada en Supabase (esquema inicial)
- [x] Tabla `notificaciones` creada en Supabase (esquema inicial)
- [x] Migración 005 con los siete estados, stock atómico y permisos RPC
- [x] Sistema de calificación al recibir y notificaciones internas en SQL
- [x] Pruebas PostgreSQL/RLS y acciones de servidor
- [x] Migración 005 aplicada en Supabase remoto
- [x] Flujo de compra completo verificado en UI (los 7 estados)
- [x] Notificaciones visibles y lectura probada en ambos paneles
- [x] Probado de principio a fin como Admin, Productor y Comprador (permisos según rol)
- [x] Responsive verificado a 375px y 1440px
- [x] `npm run build` final sin errores ni warnings nuevos


## QA contra Supabase real — 26 de septiembre de 2026

Se recorrieron las pantallas en Chromium con `agent-browser` sobre
`http://localhost:3000`, usando únicamente cuentas, lotes y pedidos de QA.
Cada cambio de estado de la UI se contrastó con `pedidos`, `lotes` y
`notificaciones` en Supabase mediante un script privado.

| Prueba | Resultado |
| --- | --- |
| Compra en dos pasos | Cantidad, dirección y revisión muestran 10 kg × S/ 5.50 = S/ 55.00. Crear el pedido deja stock 1000 y genera una notificación por parte. |
| Flujo principal | `pendiente → confirmado → enviado → recibido → calificado` mediante UI. Solo confirmar descuenta los 10 kg; queda stock 990. Calificación de 5 estrellas con comentario QA persistida y diez notificaciones (dos por estado). |
| Rechazo | Pedido separado de 3 kg rechazado por el productor con motivo obligatorio; no descuenta stock. |
| Cancelaciones | Pedido pendiente de 4 kg cancelado sin cambio de stock. Otro de 5 kg confirmado y luego cancelado: stock 990 → 985 → 990. Reintentar la cancelación no cambia stock ni duplica notificaciones. |
| Precio cambiado | Formulario abierto con precio 5.50 rechazado tras cambiar el lote a 6.00, con mensaje en español. Actualizar disponibilidad muestra 6.00. El pedido anterior conserva 5.50 y total 55.00. El precio del lote se restauró a 5.50. |
| Unidad protegida | Intentar editar kg a toneladas con pedidos pendientes conserva la unidad kg en base de datos. La UI muestra el motivo en español y mantiene los datos del formulario. |
| Validación | Cantidad cero o superior al stock, dirección vacía/corta y motivos vacíos bloqueados. Las respuestas de negocio observadas están en español, sin stack traces visibles. |

### Concurrencia remota

Además de la suite PGlite, se ejecutaron RPC simultáneas sobre Supabase real
con un lote aislado de 5 kg y dos pedidos de 3 kg. Una aceptación tuvo éxito,
la otra fue rechazada por falta de stock y quedaron 2 kg. Dos reintentos
simultáneos de aceptación no descontaron más ni notificaron otra vez. Dos
cancelaciones simultáneas del pedido confirmado devolvieron el stock a 5 kg
exactos y añadieron solo las dos notificaciones del cambio. Ese lote, sus
pedidos, notificaciones y foto de prueba se limpiaron al terminar.

La evidencia local ignorada está en
`.qa-artifacts/transacciones-concurrency-results.json` y
`.qa-artifacts/transacciones-results.json`; las capturas usan el prefijo
`.qa-artifacts/transacciones-`.

Se conservan para pruebas de integración posteriores los pedidos QA:

- Flujo calificado: `516b0598-59bd-43e3-aab4-30507d66490f`.
- Rechazo: `d741cb66-cbb9-4cf5-93f4-78a0b079bfb5`.
- Cancelación pendiente: `91c9180c-e9aa-4374-80f9-213707e76650`.
- Cancelación confirmada: `f5721408-dd71-4b91-bf79-4f33f77b33a7`.

El lote QA `34533265-d051-479e-95b1-18bc86a522a9` queda con stock positivo
(990 kg a S/ 5.50). Los textos de entrega y calificación identifican estas
operaciones como pruebas sin entrega ni cobro real.


### Paneles, permisos y verificación visual

Ambos paneles muestran los cuatro pedidos de QA y doce notificaciones por
parte. Se marcó una notificación propia como leída desde cada UI y se
corroboró `leida=true` en Supabase. Las sesiones comprador/productor no pueden
leer notificaciones ajenas; intentar marcarlas devuelve `42501` y no altera
su estado.

Se verificaron las rutas de compra, pedidos y ventas con público, comprador,
productor y administrador. El anónimo debe iniciar sesión y los cruces de
rol redirigen con «No tienes permiso para ver esta página». Un segundo
productor no ve el pedido ajeno ni su dirección. El administrador todavía
no utiliza estas pantallas específicas de comprador/productor; su interfaz
administrativa corresponde al módulo 5.

Compra, revisión, detalle de pedido, paneles y notificaciones se inspeccionaron
a 375 y 1440 px. No hubo desbordamiento horizontal, imágenes rotas, overlays,
excepciones de JavaScript ni warnings de consola. El catálogo público se
consultó al terminar y refleja los 990 kg restantes a S/ 5.50.

No se simularon cortes de red, envíos físicos ni cobros. La paginación de
pedidos/notificaciones más allá de la primera página queda sin recorrido de
navegador en esta QA; se usaron cuatro pedidos y doce avisos por parte.
