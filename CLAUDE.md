# AgroSignal — Contexto del proyecto

Marketplace agrícola para el Perú: productores publican lotes de cosecha y
compradores hacen pedidos, con una Verificación AgroSignal de tres niveles y panel
de administración. `/` es la landing de presentación y `/marketplace` el
catálogo de productos (búsqueda, filtros y estrellas).

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

- `app/page.tsx` — landing con estructura inspirada en tourba.ma (header propio transparente, no usa AppShell); íconos y curvas en `components/landing/Iconos.tsx`
- `app/marketplace` — catálogo de productos, ficha de lote (`[id]`) y perfil de productor (`productor/[id]`)
- `app/panel-productor`, `app/panel-comprador` — paneles por rol
- `app/admin` — usuarios, pedidos, certificados, drones, tests
- `app/verificaciones/[id]` — gestión de la Verificación AgroSignal de un lote
- `app/(auth)` — registro, login, recuperación y cuenta
- `components/AppShell.tsx` — header/footer compartidos (logo → `/`)
- `components/calificaciones/` — estrellas, resumen de reputación y formulario de calificación
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
- Landing: colores adaptados de producepay.com — `petroleo #133535` (bandas
  oscuras, títulos, pie), `naranja #ee7c32` (botones, con texto petróleo por
  contraste), `trigo #f3bc48` (línea bajo títulos, "Próximamente") y
  `crema #fdf9f0` (fondos suaves), junto a la tierra.
- Landing: animación al hacer scroll con `data-revelar="subir|izquierda|derecha|linea"`
  y `components/landing/AnimacionesScroll.tsx` (fundido 1.5 s + desplazamiento;
  sin JS o con movimiento reducido todo se ve normal)
- Tipografía: Fraunces (títulos h1–h3 y `.font-display`) + Plus Jakarta Sans (texto)
- `.leaf-texture` para franjas verde bosque con nervaduras de hoja
- Tailwind v4: degradados con `bg-linear-to-*` (**no** `bg-gradient-to-*`)
- Contenedor centrado: `.app-container` (max-width 1440px), no `max-w-[...]` suelto
- Íconos: SVG en línea (no se carga ninguna fuente de íconos)
- Fotos: solo con licencia libre verificada (Pexels, CC0, dominio público) y
  con créditos documentados; nunca imágenes generadas por IA presentadas como reales

## Verificación AgroSignal ≠ Sello BPA del SENASA

- En la interfaz, el antiguo "Sello de Inocuidad" se llama **Verificación
  AgroSignal** (27 set 2026). En código y base de datos siguen los nombres
  `sello`, `nivel_sello`, etc.
- El **Sello BPA** es un distintivo oficial del SENASA (RD N°
  D000042-2025-MIDAGRI-SENASA-DIAIA) para predios certificados en Buenas
  Prácticas Agrícolas. AgroSignal no lo otorga: un certificado BPA vigente se
  sube como certificado `senasa` y cuenta como nivel 1.
- No usar el logo oficial del Sello BPA ni textos que sugieran aval del SENASA.

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
- Cada landing o sub-página nueva: el logo "AgroSignal" enlaza a `/`
- Cambios de esquema: nueva migración en `supabase/migrations/` + prueba en
  `supabase/tests/`; nunca editar migraciones ya aplicadas
- Al terminar un cambio: `npm run lint`, `npm run build`, `npm run test:db`,
  luego commit + push para que Vercel redespliegue
