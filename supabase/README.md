# Base de datos de AgroSignal

Las migraciones se aplican en orden sobre un proyecto Supabase:

1. `20260926000100_esquema_inicial.sql`: siete tablas, enums, restricciones,
   índices, RLS y permisos mínimos de lectura.
2. `20260926000200_storage.sql`: cuatro buckets, límites de archivos y
   políticas de acceso por propietario o administrador.

Esta es la preparación del paso 1. No implementa todavía los módulos:
las escrituras de las tablas están cerradas a `anon` y `authenticated`.
Las siguientes migraciones agregarán el registro de perfiles, publicación,
transiciones atómicas de pedidos y revisión de evidencias en el orden de AGENTS.md.
No usar `service_role` para eludir las validaciones pendientes en la aplicación.

Los archivos se guardan con la ruta
`<productor_uuid>/<lote_uuid>/<archivo_uuid.ext>`. Las columnas de evidencias
privadas guardan esa ruta permanente; la aplicación debe generar URLs firmadas
cortas solo después de autorizar al usuario. Las fotos de lotes son públicas.

`perfiles.suspendido` amplía el modelo para la moderación del módulo 5.
Solo un administrador mediante una operación validada podrá modificarlo.
La lectura pública ya excluye lotes sin stock, bloqueados, de productores
suspendidos/no verificados o con cualquier test `no_pasa`.

## Aplicación remota

Migraciones base aplicadas y verificadas en Supabase el 26 de septiembre de
2026. El comando `node --env-file=.env.local scripts/supabase-management.mjs migrate`
aplica únicamente versiones nuevas y rechaza cambios de hash de versiones
anteriores. Los secretos permanecen en el archivo local ignorado por git.

## Validación local

`npm run test:db` ejecuta las migraciones en PostgreSQL embebido (PGlite), con
esquemas mínimos de `auth` y `storage` para probar los contratos de permisos.
Verifica RLS, bloqueo de escrituras, aislamiento entre propietarios, documentos
privados, cuentas suspendidas/no verificadas, lotes agotados y tests fallidos.
No sustituye la ejecución en Supabase ni las pruebas del navegador de cada módulo.

Referencias: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Storage](https://supabase.com/docs/guides/storage/security/access-control),
[perfiles de Auth](https://supabase.com/docs/guides/auth/managing-user-data).
