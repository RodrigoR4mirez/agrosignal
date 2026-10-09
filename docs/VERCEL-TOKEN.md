# VERCEL_OIDC_TOKEN — Generación automática

El proyecto usa `VERCEL_OIDC_TOKEN` (no un token personal `vcp_…`) para interactuar con Vercel desde la CLI y scripts de validación. Se genera automáticamente cada vez que es necesario, sin intervención manual.

## Generación

```bash
vercel env pull
```

Este comando:
- Pide la sesión de Vercel en el navegador (una sola vez con `vercel login`)
- Vincula el proyecto local a `agrosignal` en Vercel (una sola vez con `vercel link`)
- Actualiza o crea `.env.local` con un `VERCEL_OIDC_TOKEN` fresco, válido **12 horas**
- También mantiene `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y otros sincronizados

## Cuándo hacerlo

- **Al inicio de una sesión larga** de desarrollo o QA en agrosignal
- **Después de deployments** que requieren validación en Vercel
- **Si algún comando de Vercel da error 401/403**

## Restricción crítica

**Nunca** copies ni pegues un token personal (`vcp_…`) en archivos, commits o chat:
- Los tokens personales no se regeneran automáticamente
- Quedan expuestos si aparecen en el historial o en una conversación
- `VERCEL_OIDC_TOKEN` desde `vercel env pull` es el único que debe aparecer en `.env.local`

## Referencia

- `.env.local` — ignorado por git; contiene variables de desarrollo
- `docs/VARIABLES-DE-ENTORNO.md` — variables públicas y privadas del proyecto
- `.claude/agents/deploy-devops.md` — procedimiento de despliegue en Vercel
