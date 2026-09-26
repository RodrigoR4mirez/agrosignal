# Documentación de AgroSignal

Índice de todo lo que necesitas para entender y seguir construyendo el
proyecto.

## Ejecución iniciada el 26 de septiembre de 2026

Setup aplicado, dependencias de Supabase instaladas y proyecto Vercel vinculado.
Se completó manualmente la instalación y el commit del setup después de que
el primer proceso quedara sin acceso a red. Se mantuvieron fuera del commit
los archivos previos `AGENTS-old.md`, `docs-agrosignal.zip` y `docs-preview/`.

Validaciones: `npm run build` exitoso sin warnings; `npm run test:db` con
11 pruebas aprobadas sobre PostgreSQL aislado; auditoría de npm sin
vulnerabilidades tras aplicar actualizaciones compatibles del lockfile.

Paso 1 preparado en `supabase/migrations/`, sin ejecución remota.
Falta el token de administración de Supabase solicitado al usuario; ver
[VARIABLES-DE-ENTORNO.md](./VARIABLES-DE-ENTORNO.md). Los cinco módulos,
su QA de navegador y el nuevo despliegue todavía no están construidos.
`RESUMEN-EJECUCION.md` se generará al terminar el encargo completo.

| Documento | Para qué sirve |
|---|---|
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Cómo está armado técnicamente el proyecto de punta a punta |
| [MODELO-DE-DATOS.md](./MODELO-DE-DATOS.md) | Todas las tablas de la base de datos y cómo se relacionan |
| [MODULOS/01-autenticacion.md](./MODULOS/01-autenticacion.md) | Login, registro y roles |
| [MODULOS/02-marketplace.md](./MODULOS/02-marketplace.md) | Publicación y búsqueda de lotes |
| [MODULOS/03-transacciones.md](./MODULOS/03-transacciones.md) | Flujo de compra y pedidos |
| [MODULOS/04-sello-inocuidad.md](./MODULOS/04-sello-inocuidad.md) | Los 3 niveles de verificación de un lote |
| [MODULOS/05-panel-admin.md](./MODULOS/05-panel-admin.md) | Moderación y aprobaciones |
| [DESPLIEGUE.md](./DESPLIEGUE.md) | Cómo publicar la app en Vercel paso a paso |
| [VARIABLES-DE-ENTORNO.md](./VARIABLES-DE-ENTORNO.md) | Qué es cada variable y de dónde sacarla |
| [GLOSARIO.md](./GLOSARIO.md) | Términos técnicos y del agro explicados en simple |

Para las reglas de **cómo dividir el trabajo entre agentes de IA** al
construir cada módulo, ver `/AGENTS.md` en la raíz del repo.

Para convenciones de diseño, paleta de colores, pipeline de datos
climáticos y flujo de imágenes de Stitch (todo lo que ya existe y
funciona), ver `/CLAUDE.md` en la raíz del repo — ese documento no se
duplica acá.
