# Tokens de Supabase — Renovación automática

El proyecto usa tres tokens de Supabase, cada uno con una duración y riesgo distintos:

| Token | Duración | Riesgo | Dónde se usa |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Infinita | Bajo | App en navegador (RLS lo protege) |
| `SUPABASE_SERVICE_ROLE_KEY` | Infinita | **Alto** | Scripts de admin, `npm run test:db` |
| `SUPABASE_ACCESS_TOKEN` | ~90 días | Medio | `validar-catalogo.mjs`, deployments |

## Renovación automática de SUPABASE_ACCESS_TOKEN

Solo este token vence. Cuando un script falle con error **401**:

```bash
node scripts/renovar-supabase-token.mjs
```

Este script:
1. Intenta generar un token nuevo desde la API de Supabase usando `SUPABASE_SERVICE_ROLE_KEY`
2. Si funciona, actualiza `.env.local` automáticamente
3. Si falla, sugiere ir a supabase.com/dashboard/account/tokens manualmente

## Renovación manual (si el script falla)

1. Ve a **supabase.com** → Account Settings → Tokens
2. Clic en **"Generate new token"**
3. Nombre: `agrosignal-cli-YYYYMM` (ej: `agrosignal-cli-202410`)
4. Duración: **90 días**
5. Copiar el token (empieza con `sbp_`)
6. En `.env.local`, reemplaza el valor de `SUPABASE_ACCESS_TOKEN=`
7. Guardar (`.env.local` no se versiona)

## Restricciones críticas

- **Nunca expongas `SUPABASE_SERVICE_ROLE_KEY`:** bypassea todas las restricciones de RLS
- **Nunca hagas commit de ningún token:** `.gitignore` cubre `.env.local`, pero evita copiarlos en chat
- **Los tokens `NEXT_PUBLIC_*` son públicos** pero están protegidos por RLS en la base de datos

## Scripts que usan SUPABASE_ACCESS_TOKEN

- `scripts/qa/validar-catalogo.mjs` — verifica que el scroll infinito funcione en producción
- `scripts/supabase-management.mjs` — herramienta para gestionar migraciones
- `scripts/pedidos-ejemplo-fases.mjs` — QA de transacciones con datos de ejemplo

Si cualquiera de estos falla con 401, ejecuta `node scripts/renovar-supabase-token.mjs`.

## Referencia

- `.env.local` — ignorado por git; contiene variables de desarrollo
- `docs/VARIABLES-DE-ENTORNO.md` — variables públicas y privadas del proyecto
- `docs/VERCEL-TOKEN.md` — generación de VERCEL_OIDC_TOKEN
