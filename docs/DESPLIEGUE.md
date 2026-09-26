# Despliegue

**Agente responsable:** `deploy-devops` (ver `/AGENTS.md`)

El repo ya se despliega hoy en Vercel (`agrosignal.vercel.app`) con
auto-redeploy en cada push a `main` — eso no cambia. Lo que se agrega acá
es la conexión a Supabase para que el marketplace funcional también
funcione en producción.

## Checklist

1. **Crear proyecto en Supabase** (supabase.com) — plan gratuito alcanza
   para el MVP.
2. **Correr las migraciones** de las tablas listadas en
   `docs/MODELO-DE-DATOS.md` (desde el SQL Editor de Supabase o con
   `supabase db push` si usas la CLI).
3. **Copiar las claves** desde Supabase → Settings → API:
   - `Project URL`
   - `anon public key`
   (ver `docs/VARIABLES-DE-ENTORNO.md` para dónde van estas claves)
4. **Configurar variables de entorno en Vercel**: proyecto → Settings →
   Environment Variables → agregar las mismas de `.env.example` con sus
   valores reales.
5. **Redeploy**: Vercel → Deployments → "Redeploy" (o simplemente haz un
   push nuevo a `main`).
6. **Probar en producción**: registro, login, publicar un lote, hacer una
   compra de prueba — de principio a fin.

## Buckets de Storage a crear en Supabase

- `fotos-lotes` (público)
- `certificados` (privado — solo el productor dueño y admins pueden leer)
- `evidencia-drones` (privado)
- `evidencia-tests` (privado)

## Nota sobre el pipeline climático existente

El pipeline de datos climáticos (`actualizar.py`, NASA POWER, FAOSTAT)
sigue viviendo fuera de este repo, en iCloud, tal como está documentado en
`CLAUDE.md`. El despliegue del marketplace no afecta ese flujo.

## Preparación de esta ejecución — 26 de septiembre de 2026

- Sesión Vercel validada y repo vinculado al proyecto existente `agrosignal`.
- URL de producción: https://agrosignal.vercel.app.
- Migraciones base ejecutadas en Supabase: siete tablas y cuatro buckets
  verificados. Migraciones siguientes mediante `scripts/supabase-management.mjs`.
- Variables reales de Supabase y URL de sitio configuradas en producción.
  El token personal de administración no se desplegó.
- Confirmación de correo activa y redirecciones autorizadas para desarrollo
  local y producción. SMTP para destinatarios externos pendiente del proveedor.
- Los módulos se publicarán con push a `main` después de su build y QA.
