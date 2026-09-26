<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Mapa de Agentes — AgroSignal

Este archivo define cómo debe organizarse el trabajo de construcción del
**marketplace funcional** de AgroSignal (login por roles, transacciones,
Sello de Inocuidad, panel admin) sobre el dashboard de riesgo climático que
ya existe en este repo. Léelo antes de empezar cualquier módulo nuevo.

Para contexto del proyecto (paleta, convenciones de Tailwind, pipeline de
datos climáticos, flujo de imágenes de Stitch), ver `CLAUDE.md` — ese
archivo NO se toca desde acá, es la fuente de verdad de convenciones
existentes. Este archivo (`AGENTS.md`) es la fuente de verdad de **cómo
dividir el trabajo en agentes** para las funcionalidades nuevas.

## Regla de oro

Un agente = una responsabilidad. Nunca mezcles lógica de auth con lógica de
marketplace en el mismo cambio. Si tu herramienta (Claude Code, Cursor)
soporta subagentes/skills nativos, créalos con estos nombres exactos. Si no
los soporta, igual trabaja en este orden, un módulo a la vez, sin saltar.

---

## Agente: `auth-roles`

**Responsabilidad:** registro, login, roles (Admin / Productor / Comprador),
protección de rutas, recuperación de contraseña.

**Puede tocar:** `app/(auth)/*`, `lib/supabase/*`, tabla `perfiles`,
middleware de protección de rutas.

**No debe tocar:** lógica de publicación de lotes, transacciones, sello de
inocuidad, panel admin — solo quién es el usuario y qué puede ver.

**Entregable de referencia:** ver `docs/MODULOS/01-autenticacion.md`.

---

## Agente: `marketplace`

**Responsabilidad:** publicación de lotes, edición, búsqueda, filtros, vista
pública del marketplace (reemplaza gradualmente el mock actual bloqueado
"PRO" en `app/marketplace` y `app/pro`), subida de imágenes a Supabase
Storage.

**Puede tocar:** `app/marketplace/*`, tabla `lotes`, componentes de tarjetas
de producto.

**Debe respetar:** la paleta verde `#1a5c2a` / dorado `#d4a017` y las clases
`bg-linear-to-*` (Tailwind v4, nunca `bg-gradient-to-*`) ya definidas en
`CLAUDE.md`. No reinventar el sistema de diseño — reusar
`components/ui/Card.tsx` donde aplique.

**Entregable de referencia:** ver `docs/MODULOS/02-marketplace.md`.

---

## Agente: `transacciones`

**Responsabilidad:** flujo de compra, estados del pedido, descuento de
stock, notificaciones internas, calificaciones.

**Puede tocar:** tabla `pedidos`, tabla `notificaciones`, panel comprador,
panel productor (sección "mis ventas"/"mis compras").

**Entregable de referencia:** ver `docs/MODULOS/03-transacciones.md`.

---

## Agente: `sello-inocuidad`

**Responsabilidad:** los 3 niveles de verificación de un lote —
(1) documental, (2) inspección con dron, (3) tiras reactivas — y sus
badges visuales en el marketplace.

**Puede tocar:** tablas `certificados`, `inspecciones_dron`,
`tests_residuos`, componente reutilizable `<SelloInocuidadBadge />`.

**Regla de negocio crítica:** un lote con test de residuos "No pasa" se
oculta automáticamente del marketplace público — este agente es responsable
de que esa regla nunca se rompa en cambios futuros.

**Entregable de referencia:** ver `docs/MODULOS/04-sello-inocuidad.md`.

---

## Agente: `admin-panel`

**Responsabilidad:** moderación, aprobación de certificados, gestión de
solicitudes de dron, resolución de disputas de pedidos, métricas simples.

**Puede tocar:** `app/admin/*`, lectura de todas las tablas anteriores
(pero solo esas partes ya construidas por sus agentes respectivos — no
duplica su lógica, solo la consume).

**Entregable de referencia:** ver `docs/MODULOS/05-panel-admin.md`.

---

## Agente: `qa-testing`

**Responsabilidad:** se activa DESPUÉS de que otro agente termina su
módulo, nunca antes ni en paralelo. Prueba el flujo de principio a fin como
un usuario real (registro → login → publicar/comprar → verificar estados),
en local (`npm run dev`) antes de dar el módulo por cerrado.

**Checklist mínimo por módulo:**
- [ ] `npm run build` no tiene errores ni warnings nuevos.
- [ ] El flujo se probó con los 3 roles (Admin, Productor, Comprador).
- [ ] Los mensajes de error están en español simple, sin stack traces
      visibles al usuario.
- [ ] Responsive: se probó en ~375px (mobile) y ~1440px (desktop).
- [ ] El archivo `docs/MODULOS/0X-*.md` correspondiente quedó actualizado.

---

## Agente: `deploy-devops`

**Responsabilidad:** variables de entorno, conexión a Supabase, build de
producción, despliegue en Vercel.

**Puede tocar:** `.env.example`, configuración de Vercel, `next.config.ts`
solo si hace falta para producción.

**Entregable de referencia:** ver `docs/DESPLIEGUE.md`.

---

## Orden de ejecución obligatorio

```
auth-roles → marketplace → transacciones → sello-inocuidad → admin-panel → deploy-devops
                                                                    ↑
                                                    qa-testing corre después de CADA uno
```

No construyas `transacciones` antes de que `marketplace` tenga lotes reales
en base de datos (no mock). No construyas `admin-panel` antes de que
`sello-inocuidad` tenga sus tablas, porque el panel admin depende de ellas
para la cola de aprobaciones.
