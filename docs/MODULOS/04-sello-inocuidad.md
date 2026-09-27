# Módulo 4 — Verificación AgroSignal (3 niveles)

> **Nombre en la interfaz:** desde el 27 set 2026 se muestra como
> "Verificación AgroSignal" (antes "Sello de Inocuidad"), para no confundirlo
> con el **Sello BPA oficial del SENASA** (RD N° D000042-2025-MIDAGRI-SENASA-DIAIA,
> [nota en gob.pe](https://www.gob.pe/institucion/senasa/noticias/1290615-gobierno-fortalece-la-inocuidad-y-calidad-de-alimentos-con-nuevo-sello-del-senasa)).
> Un certificado BPA del SENASA vigente se sube como tipo `senasa` y aporta el
> nivel 1. No se usa el logo oficial. Los nombres internos (`sello`,
> `nivel_sello`, `SelloInocuidadBadge`) no cambian.

**Agente responsable:** `sello-inocuidad` (ver `/AGENTS.md`).

El comprador ve el mayor nivel alcanzado en cada tarjeta y los tres estados
por separado en el detalle público del lote. Cada nivel se alcanza de forma
independiente: un test que pasa acredita nivel 3 aunque todavía no exista un
certificado o un vuelo. Para exportación se recomienda completar los tres.
Estos controles son señales de verificación; el screening de residuos no
reemplaza un análisis de laboratorio ni garantiza ausencia de todo residuo.

## Gestión por lote

`/verificaciones/[id]` permite al productor gestionar exclusivamente sus
lotes y al administrador registrar/revisar evidencias. Un comprador, otro
productor o una cuenta suspendida no puede consultar los documentos, los
números de certificados, las coordenadas, las notas ni los motivos de rechazo.
La ruta y cada Server Action vuelven a comprobar la sesión y el rol; la base
de datos aplica las mismas restricciones mediante RLS y RPC.

El enlace está disponible desde Mis lotes y desde el detalle de un lote
para su propietario o un administrador. Los formularios administrativos son
reutilizables por la futura cola de `/admin`; la cola y el panel completo
se construyen en el módulo 5.

### Nivel 1 — Documental

El productor sube un PDF o una imagen (JPEG, PNG o WebP, máximo 10 MB), indica
el tipo `senasa`, `global_gap` u `otro`, el número y la fecha de vencimiento.
El registro comienza `en_revision`. Un administrador puede aprobarlo o
rechazarlo; el rechazo exige un motivo de 3 a 1000 caracteres. La decisión
queda registrada con el administrador y la fecha de revisión. Para corregir
un documento revisado se envía uno nuevo; no se sobrescribe el historial.

Un certificado aprobado aporta nivel 1 hasta el final de su fecha de vigencia
en **America/Lima**. En cada lectura del catálogo y del detalle se comprueba
esa fecha. No necesita cron, ni se modifica el estado histórico al consultar
una página. No se aceptan certificados vencidos o con vigencia a más de 20
años. Tampoco puede aprobarse uno que venció durante la revisión.

### Nivel 2 — Inspección con dron

El productor solicita el vuelo. Solo puede existir una solicitud pendiente
por lote y los reintentos devuelven la misma solicitud sin duplicar avisos.
El administrador coordina el servicio fuera de la plataforma y completa la
solicitud con latitud, longitud, fecha, notas opcionales y entre 1 y 6 fotos
o videos MP4 (máximo 50 MB por archivo).

El servidor valida las coordenadas dentro de sus rangos geográficos, la
fecha entre el 1 de enero de 2000 y hoy en Lima, las notas de hasta 2000
caracteres y las evidencias del lote. Un resultado completado conserva su
historial y no puede sobrescribirse; se puede solicitar una nueva inspección.

### Nivel 3 — Tiras reactivas

Solo un administrador registra el tipo de kit, la fecha, el resultado `pasa`
o `no_pasa` y una foto JPEG, PNG o WebP de hasta 5 MB. La fecha debe estar
entre el 1 de enero de 2000 y hoy en Lima. Se registra quién hizo la carga.

**Un resultado `no_pasa` bloquea el lote dentro de la misma transacción de
base de datos.** El lote desaparece del catálogo y su detalle público; se
notifica al productor y a todos los administradores activos con correo
verificado. El test, el bloqueo y las notificaciones se confirman juntos:
un fallo revierte todos esos cambios.

Los tests son inmutables: no pueden editarse o borrarse para eludir el
bloqueo. Un test posterior `pasa` se conserva en el historial pero no levanta
el bloqueo ni el badge público. Ni actualizar stock, cambiar a borrador y
volver a publicar, ni poner `bloqueado=false` permite eludirlo. No existe
un flujo de desbloqueo automático.

Los pedidos nuevos y las confirmaciones siguen verificando la disponibilidad.
Además, un pedido confirmado de un lote bloqueado no puede pasar a enviado;
su cancelación devuelve el stock sin levantar el bloqueo. Un lote sano con
stock cero porque ya se reservó toda su cantidad sí puede enviarse.

## Evidencias y contrato de datos

La migración `20260926000600_sello_inocuidad.sql` extiende las tres tablas ya
creadas en 001; las migraciones 001–005 permanecen intactas. Añade marcas de
tiempo, auditoría de revisión/vuelo, índices de idempotencia y los triggers
de protección.

Los archivos se suben directamente a los buckets privados `certificados`,
`evidencia-drones` y `evidencia-tests` con la sesión del usuario, evitando
pasar archivos grandes por Server Actions. La ruta obligatoria es:

```
<productor_uuid>/<lote_uuid>/<archivo_uuid>.<extensión>
```

La base de datos valida que el objeto exista en el bucket correcto, que la
ruta corresponda al productor/lote, que la extensión coincida con el MIME
del objeto y que el tamaño esté dentro del máximo. No hay políticas de
sobrescritura o borrado para estas evidencias. Los campos heredados con
sufijo `_url` guardan **rutas permanentes**, nunca URLs firmadas.

`lib/sello/data.ts` firma evidencias por 10 minutos únicamente después de
autorizar al dueño o al administrador. El DTO público solo expone
`nivel_sello`, `documental`, `dron`, `residuos` y `bloqueado`; los detalles
privados no salen de las consultas de gestión. Un archivo que no puede
firmarse se muestra sin enlace disponible, conservando el historial.

Las mutaciones se realizan mediante RPC `SECURITY DEFINER`, con
`search_path=''` y permisos de ejecución mínimos:

- `subir_certificado`: productor propietario.
- `revisar_certificado`: administrador activo.
- `solicitar_inspeccion_dron`: productor propietario.
- `completar_inspeccion_dron`: administrador activo.
- `registrar_test_residuos`: administrador activo.
- `estado_sello_lote`: estados mínimos para lotes públicos o gestión autorizada.

No se concede escritura directa en las tablas de evidencia a `authenticated`.
Las operaciones notifican al productor; las nuevas solicitudes y los
resultados `no_pasa` también notifican a los administradores activos. Los
reintentos con la misma evidencia/decisión no duplican registros ni avisos.

## Validación

`npm run test:db` incluye `supabase/tests/sello.test.mjs`, que ejecuta las seis
migraciones en Postgres/PGlite y comprueba permisos de los tres roles,
Storage privado, validación de rutas/MIME/tamaños, caducidad en Lima,
revisión motivada, independencia de niveles, solicitud única, inmutabilidad,
idempotencia, bloqueo persistente, notificaciones y rollback atómico.
También prueba el envío/cancelación de pedidos después de un test fallido.

## Estado

- [x] Tablas y buckets privados creados; RPC y triggers del módulo implementados.
- [x] Validaciones de propiedad, fechas, coordenadas y objetos Storage.
- [x] Caducidad por lectura en America/Lima y DTO público sin evidencia privada.
- [x] Pruebas automatizadas de seguridad y regla de bloqueo.
- [x] Verificación final de UI y build tras integrar los formularios.
- [x] QA secuencial en navegador con Admin, Productor y Comprador (375/1440 px).
- [x] Confirmación contra Supabase real de la migración y el flujo completo.

## Evidencia QA — 26 de septiembre de 2026

La migración 006 quedó aplicada en Supabase real. `npm run test:db` pasó
45/45 pruebas; el build final posterior al ajuste del botón destructivo
(sesión 2160) terminó con código 0, sin warnings nuevos. QA se ejecutó
secuencialmente con `agent-browser` sobre `npm run dev` en localhost:3000.

- **Flujo documental y dron:** el productor subió un PDF de prueba a Storage
  privado y solicitó una inspección; el administrador aprobó el documento y
  completó el vuelo con GPS, fecha, notas y JPEG ilustrativo. Se verificaron
  niveles 0 → 1 → 2 → 3 mediante UI y RPC al registrar posteriormente un
  test `pasa`. El rechazo de otro documento exigió motivo; las confirmaciones
  de revisión permitieron volver sin guardar. GPS fuera de rango, falta de
  evidencia y archivo de formato inválido impidieron continuar/guardar con
  mensajes en español. Registrar un test exigió foto y confirmación explícita.
- **Bloqueo real:** el lote QA aislado
  `2dbed525-3231-454e-a7db-9f975c405914` recibió `no_pasa` desde la UI,
  con botón rojo y checkbox obligatorio. Desapareció del catálogo y detalle
  público para anónimo, comprador, productor dueño y administrador. Continuó
  visible en Mis lotes y gestión con advertencia de bloqueo. Un test posterior
  `pasa` conservó el bloqueo y el estado efectivo `no_pasa`.
- **Protección en servidor:** modificar o borrar el test fallido, incluso
  usando service role en el script privado QA, fue rechazado con `22023`.
  También se rechazó `bloqueado=false`. El pedido confirmado
  `475d6818-03f7-4899-bc45-73afc2e0d605` no pudo pasar a enviado; cancelarlo
  restituyó exactamente los 5 kg reservados (95 → 100), sin quitar el bloqueo.
- **Privacidad:** dueño y administrador abrieron los enlaces firmados de los
  tres tipos de evidencia (HTTP 200). Las URLs públicas sin firma dieron 400;
  anónimo no pudo firmarlas. Comprador no obtuvo filas privadas por RLS y
  anónimo recibió `42501`. La ruta de otro productor mostró la página de
  acceso no disponible; comprador redirigió a su panel sin permiso y anónimo
  a login. El HTML público no incluyó rutas privadas, URLs firmadas, número
  de certificado ni GPS; el DTO público mantuvo únicamente sus cinco campos.
  Se comprobaron rutas productor/lote/UUID, MIME PDF/JPEG y tamaños reales
  de 650 y 27094 bytes respectivamente.
- **Caducidad y avisos:** se cambió temporalmente la fecha del certificado QA
  aprobado a ayer. La lectura pública mostró «Documento vencido» sin cron y
  conservó los niveles de dron/test; después se restauró su fecha original.
  El bloqueo creó avisos para el productor y el administrador QA. El enlace
  «Ver verificaciones» del panel productor abrió la gestión del lote correcto.
- **Visual:** gestión, evidencia de dron, confirmación No pasa, resumen público,
  bloqueo y notificaciones revisados visualmente a 375 y 1440 px, tras esperar
  las animaciones. `scrollWidth` coincidió con el viewport, sin desbordamiento
  horizontal ni overlay de error. Cierre con cero excepciones, errores o
  warnings de consola; sólo mensajes informativos de React/HMR.

El lote principal `34533265-d051-479e-95b1-18bc86a522a9` permanece publicado,
sin bloqueo, con nivel 3, **990 kg a S/ 5.50**. Para la cola del módulo 5 se
conservaron un certificado nuevo en revisión
(`95224579-7903-447b-87e0-1812df400159`) y una solicitud de dron pendiente
(`05565677-a8ea-427f-b9e7-e99808bf9838`). El lote fallido y sus tests quedan
conservados para auditoría. Todos los documentos, vuelos y resultados usados
son fixtures explícitos de QA: no representan certificaciones, ensayos ni
cosechas reales.

Resultados e IDs sin credenciales: `.qa-artifacts/sello-results.json`.
Capturas locales: `.qa-artifacts/sello-*-375.png` y `sello-*-1440.png`,
incluyendo `public-level3`, `no-pasa-confirm`, `blocked-owner` y
`notifications`. El navegador se cerró y el servidor dev quedó activo en
la sesión 19514. No se incluyeron secretos o enlaces firmados en el reporte.

Límites de esta QA: se cargaron PDF y JPEG reales; no se hizo una carga MP4
de 50 MB ni una subida de seis archivos completos. Los límites de tamaño,
extensión/MIME, idempotencia y el borde horario exacto de Lima quedaron
cubiertos por la suite SQL. No se simuló una caída de red durante la subida.
