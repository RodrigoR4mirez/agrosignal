# Módulo 5 — Panel de Administración

**Agente responsable:** `admin-panel` (ver `/AGENTS.md`)

## Qué problema resuelve

Le da al Admin un solo lugar para moderar todo lo que los otros módulos
generan: certificados pendientes, solicitudes de dron, tests fallidos,
disputas de pedidos.

## Secciones (`/admin`)

1. **Usuarios** — lista de productores/compradores, opción de suspender
   cuenta.
2. **Certificados pendientes** — cola del Nivel 1 del Sello de
   Inocuidad, Aprobar/Rechazar con motivo.
3. **Solicitudes de inspección con dron** — cola del Nivel 2, formulario
   para subir resultado una vez hecha la inspección real.
4. **Tests de residuos fallidos** — lista de lotes bloqueados por
   `no_pasa`, para seguimiento.
5. **Pedidos/transacciones** — vista general filtrable por estado, para
   resolver disputas entre productor y comprador.
6. **Métricas simples** — tarjetas con: lotes activos, transacciones del
   mes, usuarios nuevos (sin gráficos complejos en el MVP).
7. **Notificaciones** — avisos propios del administrador, enlaces a los
   expedientes de verificación y opción de marcar cada aviso como leído.

## Reglas de negocio

- Toda acción irreversible (rechazar certificado, suspender cuenta) pide
  confirmación antes de ejecutarse.
- El panel solo lee de las tablas de los demás módulos — no duplica su
  lógica de negocio, solo la consume y actúa sobre sus estados.

## Estado

- [x] Navegación del panel (menú lateral)
- [x] Sección Usuarios
- [x] Sección Certificados pendientes
- [x] Sección Solicitudes de dron
- [x] Sección Tests fallidos
- [x] Sección Pedidos/transacciones
- [x] Tarjetas de métricas simples
- [x] Buzón de notificaciones del administrador

## Implementación y alcance

- Las lecturas del panel se protegen con `requireRole('admin')` en cada
  función y mantienen RLS con el cliente de la sesión. No se utiliza la
  clave `service_role` en la aplicación. Las listas se paginan de 12 en 12.
- La moderación acepta únicamente productores y compradores. No permite
  suspender administradores ni la propia cuenta. Exige motivo, registra
  administrador y fecha, conserva un historial acumulativo en `perfiles`
  y notifica al afectado. La suspensión retira automáticamente los lotes
  del catálogo mediante las reglas existentes; reactivar no elimina
  bloqueos por residuos.
- Cada formulario de moderación lleva versión e identificador de solicitud:
  un reintento no duplica avisos y una pantalla desactualizada no revierte
  una decisión posterior de otro administrador.
- Las colas consumen certificados, inspecciones y tests del módulo 4.
  La evidencia sigue siendo privada, con enlaces firmados de 10 minutos.
  Los resultados `no_pasa` se conservan para seguimiento; el panel no
  ofrece una opción de desbloqueo.
- La resolución de pedidos registra un único acuerdo inmutable en
  `pedidos`, visible a ambas partes mediante RLS, con administrador,
  fecha y estado anterior. Se puede guardar un acuerdo manteniendo el
  estado o cancelar únicamente un pedido pendiente/confirmado. La
  cancelación consume `cambiar_estado_pedido` del módulo 3: devuelve stock
  confirmado una sola vez y conserva los avisos de cambio de estado.
  La resolución envía además su texto a ambas partes. No procesa cobros
  ni devoluciones monetarias.
- Las métricas usan el mes calendario de Lima. «Pedidos del mes» cuenta
  todas las solicitudes creadas, cualquiera sea su estado; «Usuarios
  nuevos» cuenta registros de productores/compradores. «Lotes activos»
  cuenta los lotes que realmente aparecen en el catálogo público.

## Validación

- [x] Migración `20260926000700_admin_panel.sql` con auditoría y RPC de
  administración; comprobada con PostgreSQL embebido.
- [x] Tests de autorización, conflictos, reintentos, privacidad, stock,
  rollback completo ante un aviso fallido y conservación del bloqueo
  por residuos.
- [x] Migración aplicada en Supabase remoto.
- [x] `npm run build` exitoso, sin nuevos avisos.
- [x] Flujo completo en `npm run dev` con Admin, Productor y Comprador.
- [x] Mensajes y confirmaciones en español simple.
- [x] Responsive comprobado en aproximadamente 375px y 1440px.

## Evidencia QA — 26 de septiembre de 2026

La migración 007 quedó aplicada en Supabase real (sesión 17499).
`npm run test:db` pasó **55/55** pruebas. El build final con el buzón admin
(sesión 76915) terminó con código 0, sin warnings nuevos. También pasó
ESLint de las fuentes admin, feedback y formularios de sello (sesión 48165).
La QA se ejecutó secuencialmente con `agent-browser` sobre localhost:3000.

- **Usuarios:** filtros combinados por nombre, rol y estado; suspensión y
  reactivación del productor exclusivo QA con confirmación cancelable y
  motivo obligatorio. La suspensión ocultó su lote del catálogo y su login
  llegó a `/cuenta-suspendida`. La reactivación restauró el lote sano,
  mantuvo oculto el lote bloqueado por residuos y conservó el historial.
  Repetir una solicitud antigua no revirtió la reactivación ni aumentó la
  versión. La cuenta quedó activa, versión 4, tras dos ciclos de prueba.
- **Certificados:** aprobado desde la cola el pendiente
  `95224579-7903-447b-87e0-1812df400159`; rechazado con motivo el documento
  sintético adicional `104af49b-055d-4bcf-b6ca-33bb24f12b43`. Los enlaces
  privados abrieron con HTTP 200 y las filas salieron de la cola.
- **Dron y residuos:** la solicitud
  `05565677-a8ea-427f-b9e7-e99808bf9838` se completó desde la cola con GPS,
  fecha, notas QA y JPEG real subido a Storage privado. El test fallido
  permaneció en seguimiento, con foto firmada accesible y sin opción de
  desbloqueo.
- **Pedidos:** filtros por cultivo, estado y UUID completo verificados.
  El formulario de resolución exigió texto y checkbox de confirmación en
  el segundo paso. Cancelar el pedido QA confirmado de 2 kg
  `b22bc427-bc5c-4bfd-a52f-a106736c9957` devolvió el stock de 988 a 990 kg.
  El acuerdo del pedido `516b0598-59bd-43e3-aab4-30507d66490f` conservó su
  estado `calificado`. Ambas resoluciones fueron visibles en admin y en
  las vistas de comprador/productor, con avisos a las dos partes.
  Los reintentos no duplicaron stock ni notificaciones. Intentar editar
  una resolución con service role en el script privado QA devolvió `22023`.
- **Accesos:** productor, comprador y anónimo probaron las siete rutas
  `/admin`, `/admin/usuarios`, `/admin/certificados`, `/admin/drones`,
  `/admin/tests`, `/admin/pedidos` y `/admin/pedidos/[id]`. Los roles sin
  permiso volvieron a su panel con aviso; anónimo fue dirigido al login.
  Las RPC de métricas, moderación y resolución rechazaron a productor y
  comprador con `42501`.
- **Métricas y buzón:** los valores de UI coincidieron con la RPC real:
  1 lote activo, 6 pedidos del mes, 4 usuarios nuevos, ninguna solicitud
  pendiente y 1 lote bloqueado. El aviso admin de `no_pasa` abrió el
  expediente bloqueado correcto; «Marcar como leída» persistió en DB
  sobre una notificación perteneciente al administrador QA.
- **Feedback y visual:** se corrigió el aviso de éxito que desaparecía
  cuando una acción retiraba su fila de una lista filtrada. Aprobación,
  rechazo, dron, suspensión y reactivación conservaron el aviso tras quedar
  cero filas. Las vistas admin y las resoluciones de comprador/productor
  se inspeccionaron a 375 y 1440 px tras estabilizar el render, sin
  desbordamiento horizontal. La comprobación final terminó con cero
  errores, excepciones o warnings de consola.

Los datos usados son exclusivamente QA, sin compra, entrega, certificado
ni vuelo reales. Se conservan los registros inmutables para auditoría. El
lote principal `34533265-d051-479e-95b1-18bc86a522a9` queda publicado y sin
bloqueo, con **990 kg a S/ 5.50**; el lote de residuos fallidos sigue oculto.

Resultados e IDs: `.qa-artifacts/admin-results.json`. Capturas finales:
`.qa-artifacts/admin-*-375.png` y `admin-*-1440.png`, incluyendo
`users-filtered`, `reactivation-success`, `drone-success`, `resolution-cancelar`,
`comprador-resolution`, `productor-resolution`, `admin-notification` y
`metrics-final`. Consola final: `.qa-artifacts/admin-console-final.txt`.
No se incluyen credenciales ni URLs firmadas en el reporte.

El navegador quedó cerrado. El servidor dev se reinició tras una
interrupción y queda activo en la **sesión 2998**. No se probaron listas
con más de 12 resultados ni una caída de red durante una decisión; los
conflictos entre administradores y rollback transaccional están cubiertos
por la suite SQL.

## Vendedores en revisión (27 set 2026)

Nueva sección `/admin/vendedores` con contador en el resumen: lista
productores con al menos 5 calificaciones visibles de compradores y
promedio menor a 3 estrellas (RPC `vendedores_en_revision()`, solo admin).
Solo informa: la decisión sobre la cuenta se toma en Usuarios, con la
moderación auditada que ya existe. El detalle de cada pedido muestra
también sus calificaciones y si siguen ocultas por el doble ciego. Reglas
completas en `docs/MODULOS/03-transacciones.md` § Calificaciones.
