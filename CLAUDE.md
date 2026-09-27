# AgroSignal — Contexto del proyecto

Marketplace agrícola para el Perú: productores publican lotes de cosecha y
compradores hacen pedidos, con un Sello de Inocuidad de tres niveles y panel
de administración. `/` redirige a `/marketplace`.

> El antiguo dashboard de riesgo climático y la página de El Niño se
> eliminaron el 26 set 2026 (siguen en el historial de git, commit `6c3b055`).
> El pipeline Python de clima en iCloud (`PROYECTOS/agronomia/`) ya no
> alimenta este repo y su cron mensual quedó desactivado.

## Infraestructura

- Mac, Node.js v22, repo en iCloud: `PROYECTOS/agrosignal`
- Repo GitHub: `github.com/RodrigoR4mirez/agrosignal`
- Deploy: Vercel (`agrosignal.vercel.app`), auto-redeploy en cada push a main
- Base de datos, auth y archivos: Supabase (migraciones en `supabase/migrations/`,
  pruebas con PGlite en `supabase/tests/`, `npm run test:db`)
- Variables: ver `docs/VARIABLES-DE-ENTORNO.md` (`.env.local` no se versiona)
- iCloud a veces duplica archivos generados en `.next/types` ("… 2.ts") y
  rompe `tsc`; se borran sin problema (`rm -rf .next/types`)

## Estructura

- `app/marketplace` — catálogo público y ficha de lote (`[id]`)
- `app/panel-productor`, `app/panel-comprador` — paneles por rol
- `app/admin` — usuarios, pedidos, certificados, drones, tests
- `app/verificaciones/[id]` — gestión del Sello de Inocuidad de un lote
- `app/(auth)` — registro, login, recuperación y cuenta
- `components/AppShell.tsx` — header/footer compartidos (logo → `/marketplace`)
- `components/marketplace/Portada.tsx` — hero, "Así funciona" y mosaico de cultivos
- `components/ui/Card.tsx` — Card/CardHeader/CardTitle/CardDescription
- `lib/marketplace`, `lib/transacciones`, `lib/sello`, `lib/admin`, `lib/supabase`
- Documentación por módulo en `docs/` (ver `docs/README.md`); reparto de trabajo
  por agentes en `AGENTS.md`

## Diseño

- Estética tierra. Tokens en `app/globals.css` (`@theme`), usables como clases
  Tailwind: `bosque #173d2c`, `bosque-claro #24543d`, `musgo #6f8f4e`,
  `tierra #7a4a2e`, `cacao #4a2c1d`, `arena #e6d3b3`, `arena-claro #f3e9d6`,
  fondo salvia `#eef0e6`. Verde marca `#1a5c2a` y dorado `#d4a017` siguen
  presentes en paneles y formularios.
- Tipografía: Fraunces (títulos h1–h3 y `.font-display`) + Plus Jakarta Sans (texto)
- `.leaf-texture` para franjas verde bosque con nervaduras de hoja
- Tailwind v4: degradados con `bg-linear-to-*` (**no** `bg-gradient-to-*`)
- Contenedor centrado: `.app-container` (max-width 1440px), no `max-w-[...]` suelto
- Íconos de la portada: Material Symbols Outlined, enlazada en `app/marketplace/layout.tsx`
- Fotos: solo con licencia libre verificada (Pexels, CC0, dominio público) y
  con créditos documentados; nunca imágenes generadas por IA presentadas como reales

## Datos de ejemplo en producción

- 15 productores y 20 compradores con correo `*.ejemplo@example.com`, 21 lotes
  y 17 pedidos. Los lotes llevan `descripcion` con prefijo `[Ejemplo] `
  (`MARCA_EJEMPLO` en `lib/marketplace/types.ts`): la UI los etiqueta
  "Ejemplo", muestra un aviso y no permite comprarlos.
- Carga: `scripts/cargar-ejemplos.mjs` · Retiro: `scripts/limpiar-ejemplos.sql`
  (SQL Editor de Supabase) · Créditos de fotos: `docs/creditos-fotos-ejemplo.md`
- Hay además 6 cuentas QA `ag…@example.com` del desarrollo que el script de
  limpieza no borra.
- No crear datos inventados presentados como reales: todo dato de demostración
  debe ir marcado como ejemplo.

## Convenciones para cambios en este repo

- Mantener la paleta tierra/verde/dorado en cualquier componente nuevo
- Cada landing o sub-página nueva: el logo "AgroSignal" enlaza a `/marketplace`
- Cambios de esquema: nueva migración en `supabase/migrations/` + prueba en
  `supabase/tests/`; nunca editar migraciones ya aplicadas
- Al terminar un cambio: `npm run lint`, `npm run build`, `npm run test:db`,
  luego commit + push para que Vercel redespliegue
