# Resumen de ejecución — AgroSignal

**Fecha:** 26 de septiembre de 2026, hora de Perú.

**Producción:** https://agrosignal.vercel.app

**Marketplace:** https://agrosignal.vercel.app/marketplace

Los cinco módulos y el pulido están construidos, verificados y desplegados
con Supabase real. El pendiente que impide abrir el registro público completo
es **configurar SMTP para entregar correos de confirmación y recuperación**.
Las cuentas ya confirmadas pueden utilizar los flujos implementados.

## Qué se construyó

| Área | Resultado |
|---|---|
| Autenticación y roles | Registro por pasos, login/logout, confirmación, recuperación y cambio de contraseña; rutas y acciones protegidas para Admin, Productor y Comprador |
| Marketplace | Publicación y edición de lotes reales, borradores, fotos en Storage, búsqueda, filtros, paginación, detalle público y eliminación con confirmación |
| Transacciones | Compra, estados del pedido, precio acordado conservado, stock atómico al confirmar, devolución única al cancelar, notificaciones y calificaciones |
| Sello de Inocuidad | Certificados y caducidad, inspecciones con dron, tests con evidencia privada y distintivos públicos; un resultado No pasa bloquea el lote y no se elimina con un test posterior |
| Administración | Usuarios y moderación auditada, colas de certificados/drones, seguimiento de tests fallidos, disputas con resolución conservada, métricas y notificaciones |
| Usabilidad | Errores y éxitos en español, confirmaciones, formularios largos en pasos, responsive y ayuda global con cuatro temas y 25 preguntas; `/pro` lleva al catálogo funcional |

Se aplicaron **siete migraciones**, con las siete tablas de negocio y los
cuatro buckets solicitados. Solo las fotos de lotes son públicas. La app usa
sesiones, RLS y operaciones de base de datos que validan permisos; no utiliza
la clave de servicio para ejecutar acciones de usuarios.

En esta ejecución el dashboard climático se conservó intacto; se retiró
después, el 26 set 2026, para dejar AgroSignal enfocado en el marketplace.

## Verificaciones realizadas

- `npm run build` correcto después de cada módulo y del pulido, sin errores
  ni advertencias nuevas de compilación.
- **55 pruebas de PostgreSQL aislado aprobadas**, incluyendo RLS, roles,
  reintentos, conflictos, stock, auditoría y bloqueo por residuos.
- QA local con Supabase real y los tres roles; pantallas inspeccionadas a
  aproximadamente **375 y 1440 px**.
- Producción verificada sobre el commit funcional `0edef07`, con despliegue
  Vercel **READY**. Variables de producción comprobadas y páginas privadas
  servidas sin caché compartida.
- En la URL pública se enviaron los tres pasos de registro. Supabase devolvió
  un error de envío de correo en español. Para continuar la prueba se confirmó
  exclusivamente una cuenta QA mediante un enlace administrativo privado:
  **esto no verifica entrega real de correo**.
- Con esa cuenta se publicó un lote y una foto real en Storage. Un comprador
  realizó un pedido de **7 kg × S/5.50 = S/38.50**; se recorrieron confirmación,
  envío, recepción y calificación de 5 estrellas. El stock cambió de 100 a
  93 kg al confirmar. Cantidad excesiva y precio desactualizado fueron rechazados
  sin crear compras adicionales.
- Login/logout y restricciones de los tres roles comprobados en producción;
  navegación, ayuda y pantallas revisadas sin desbordamientos ni errores o
  advertencias de consola.

El detalle y los límites de cada prueba están en los documentos de
[módulos](./README.md) y [despliegue](./DESPLIEGUE.md). La evidencia local está
en `.qa-artifacts/`: informes JSON y capturas, incluidos
`production-results.json` y `final-cleanup-results.json`. Está excluida de
Git y del despliegue.

## Qué quedó pendiente

1. **SMTP personalizado en Supabase Auth:** faltan host, puerto, usuario,
   contraseña y remitente verificado. Después se deben configurar las plantillas
   y comprobar registro y recuperación con una dirección externa real. La
   confirmación de correo permanece activa; no se debilitó para eludir el problema.
   Instrucciones en [VARIABLES-DE-ENTORNO.md](./VARIABLES-DE-ENTORNO.md).
2. **Avisos no bloqueantes de herramientas:** `npm run lint` termina sin errores
   y sin avisos (los componentes antiguos de Stitch se eliminaron). Vercel advierte sobre el `postinstall` no autorizado de
   `unrs-resolver`, dependencia de desarrollo; el build termina correctamente.
   No se habilitaron scripts adicionales para ocultar ese aviso.

No se detectaron fallos de aplicación pendientes en los recorridos probados.
No se hicieron pruebas de carga, archivos de dron de 50 MB, seis archivos
simultáneos ni todas las interrupciones de red; esos límites figuran en QA.
Los pagos en línea pertenecen a una fase posterior: el alcance implementado
registra pedidos y permite coordinar pagos fuera de la plataforma.

## Datos de prueba y acceso

Las publicaciones QA quedaron fuera del catálogo: las dos ofertas utilizadas
se retiraron poniendo el stock en cero y el lote con residuos fallidos conserva
su bloqueo. Se mantuvieron pedidos, resoluciones y evidencias para respetar el
historial y las reglas de inmutabilidad. No se presentan como ofertas comerciales.

Las cuentas QA se conservan para revisión. Sus credenciales están únicamente
en archivos locales ignorados, como `.env.qa-accounts.local` y
`.qa-artifacts/production-private.json`, con permisos `0600`; no se incluyen
en este documento ni en Git. El token personal de administración tampoco se
desplegó en Vercel.

## Commits y publicación

Cada módulo se subió inmediatamente después de su build y QA:

| Commit | Entrega |
|---|---|
| `e33d4cb` | Módulo 1: autenticación y roles |
| `837cc4c` | Módulo 2: marketplace de lotes reales |
| `99ff5c0` | Módulo 3: pedidos y stock atómico |
| `82a4770` | Módulo 4: sello y bloqueo automático |
| `eea0de4` | Módulo 5: administración y disputas |
| `0edef07` | Ayuda global y pulido de usabilidad |

La integración de Git con Vercel publicó los cambios desde `main`. El cierre
añade esta documentación sin modificar la aplicación verificada.

## Próximos pasos sugeridos

1. Configurar SMTP y validar la entrega real de confirmaciones y recuperación.
2. Crear cuentas operativas y asignar una cuenta real de administrador desde
   Supabase; reservar las cuentas QA para pruebas.
3. Publicar cosechas reales con fotos, contactos y verificaciones auténticas.
4. Evaluar pagos integrados cuando se defina esa siguiente fase.
