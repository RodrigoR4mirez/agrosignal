# Documentación de AgroSignal

Índice de todo lo que necesitas para entender y seguir construyendo el
proyecto.

## Ejecución del marketplace — septiembre de 2026

Los cinco módulos están implementados y verificados secuencialmente con
Supabase real. Cada uno se guardó y subió después de un build correcto y QA
local con los tres roles, a 375 y 1440 px. Los resultados particulares y sus
límites están en los documentos de cada módulo.

- Siete tablas, cuatro buckets y siete migraciones aplicadas.
- `npm run test:db`: 55 pruebas aprobadas sobre PostgreSQL aislado.
- `npm run build`: sin errores ni advertencias nuevas.
- `npm run lint`: sin errores ni avisos.
- Variables reales de Supabase configuradas en Vercel. El token personal de
  administración se mantiene únicamente en el entorno local.
- El envío de correos públicos sigue pendiente de SMTP personalizado:
  [VARIABLES-DE-ENTORNO.md](./VARIABLES-DE-ENTORNO.md). Las pruebas con enlaces
  administrativos no equivalen a entrega real de correos.

Los artefactos de QA se guardan localmente en `.qa-artifacts/`, excluidos de
Git y del despliegue.

> El dashboard de riesgo climático y la página de El Niño se eliminaron el
> 26 set 2026; AgroSignal es ahora solo el marketplace.

| Documento | Para qué sirve |
|---|---|
| [RESUMEN-EJECUCION.md](./RESUMEN-EJECUCION.md) | Resultado final, producción, verificaciones y pendientes |
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

Para las reglas de **cómo dividir el trabajo entre agentes de IA**, el
contexto del proyecto, las convenciones de diseño y los datos de ejemplo, ver
`/AGENTS.md` en la raíz del repo. Es la única fuente de instrucciones.

## Usabilidad transversal verificada

- [x] Ayuda con cuatro temas y 25 preguntas; accesible desde pantallas
  públicas, login y los tres paneles.
- [x] Confirmaciones antes de eliminar, cancelar, rechazar, moderar o
  registrar resultados definitivos; mensajes de éxito persistentes en colas.
- [x] Formularios largos divididos en pasos y errores en español.
- [x] `/pro` redirige al catálogo real; 404 y páginas de error ofrecen ayuda.
- [x] Marketplace, ayuda, redirección PRO y 404 inspeccionados a 375 y
  1440 px, sin desbordamientos ni errores/avisos de consola.

Evidencia local: `.qa-artifacts/pulido-results.json` y `pulido-*.png`.
Los límites de QA por módulo están documentados en sus respectivos archivos.
