# Arquitectura

## Panorama general

```
┌─────────────────────────────────────────────────────────────┐
│                         Usuario (browser)                     │
└───────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router) — desplegado en Vercel                │
│  ├── / (landing)                                               │
│  ├── /marketplace (público, lotes en venta)                    │
│  ├── /fenomeno-nino (dashboard de riesgo climático, ya existe)  │
│  ├── /panel-productor  (requiere sesión, rol Productor)         │
│  ├── /panel-comprador  (requiere sesión, rol Comprador)         │
│  └── /admin            (requiere sesión, rol Admin)             │
└───────────────────────────┬─────────────────────────────────┘
                             │  (Supabase JS client)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase                                                       │
│  ├── Auth        → login, registro, sesiones                   │
│  ├── Postgres DB → perfiles, lotes, pedidos, certificados,       │
│  │                 inspecciones_dron, tests_residuos,           │
│  │                 notificaciones                               │
│  └── Storage     → fotos de lotes, certificados PDF,            │
│                     evidencia de drones, fotos de tiras          │
└─────────────────────────────────────────────────────────────┘
```

## Por qué este stack

- **Next.js**: ya es lo que usa el dashboard de riesgo climático actual —
  no se cambia de framework, se extiende.
- **Supabase**: da base de datos (Postgres), autenticación con roles, y
  almacenamiento de archivos en un solo servicio, sin necesitar un
  backend separado. Tiene plan gratuito suficiente para el MVP.
- **Vercel**: ya es donde vive el deploy actual (`agrosignal.vercel.app`),
  con auto-redeploy en cada push a `main` — no cambia.

## Dos mundos que conviven en el mismo repo

1. **Dashboard de riesgo climático** (ya existe, no se toca su lógica):
   lee CSVs estáticos de `data/` en tiempo de build/request
   (`lib/parseData.ts`). No usa base de datos.
2. **Marketplace funcional** (lo que se construye con los módulos de
   `docs/MODULOS/`): usa Supabase para todo lo que es dinámico (usuarios,
   lotes, pedidos, verificaciones).

Estos dos mundos no se pisan entre sí. El marketplace puede eventualmente
mostrar el nivel de riesgo climático de la región de un lote leyendo
`getRiesgoData()` de `lib/parseData.ts` como dato de solo lectura, pero no
depende de Supabase para eso.

## Carpetas nuevas que se agregan

```
app/
  (auth)/            ← login, registro (agente auth-roles)
  panel-productor/   ← agente marketplace + transacciones
  panel-comprador/   ← agente transacciones
  admin/             ← agente admin-panel
lib/
  supabase/
    client.ts        ← cliente de Supabase para el browser
    server.ts        ← cliente de Supabase para Server Components
    middleware.ts     ← protección de rutas por rol
```
