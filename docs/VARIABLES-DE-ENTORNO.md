# Variables de Entorno

Estas variables van en tu archivo `.env.local` (nunca subido a git — ya
está en `.gitignore`) y también, con los mismos valores, en Vercel →
Settings → Environment Variables cuando despliegues.

| Variable | Para qué sirve | Dónde la consigo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto de Supabase | Supabase → tu proyecto → Settings → API → "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública para que el navegador hable con Supabase | Supabase → Settings → API → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada, solo para acciones de servidor (ej. aprobar certificados desde el panel admin) — **nunca exponer al navegador** | Supabase → Settings → API → "service_role" (marcada como secreta) |

El prefijo `NEXT_PUBLIC_` es especial en Next.js: cualquier variable con
ese prefijo queda visible en el navegador. Por eso la `service_role` NUNCA
lleva ese prefijo — si la agregas con `NEXT_PUBLIC_` por error, cualquiera
podría ver esa clave y tendría acceso total a tu base de datos.

## Estado de configuración — 26 de septiembre de 2026

- Credenciales reales recuperadas con el token proporcionado por el usuario.
- Proyecto Supabase `typzvosvhoqevjijoguq` (único proyecto disponible,
  esquema público vacío antes del setup).
- `.env.local` contiene URL, anon, service_role y token de administración.
  Está ignorado por git y tiene permisos locales restringidos.
- URL, anon y service_role configuradas en producción Vercel, junto con
  `NEXT_PUBLIC_SITE_URL=https://agrosignal.vercel.app`.
- El token personal `SUPABASE_ACCESS_TOKEN` solo se usa para administración
  local; no se despliega ni se expone al navegador.
- Siete tablas y cuatro buckets creados y comprobados mediante consultas
  remotas. Solo `fotos-lotes` es público.
- Confirmación de correo activa; URLs autorizadas: localhost y producción.

## Administración local

`SUPABASE_PROJECT_REF` identifica el proyecto y `SUPABASE_ACCESS_TOKEN`
autoriza las migraciones. Ejecutar:

```sh
node --env-file=.env.local scripts/supabase-management.mjs migrate
```

El script registra versiones y hashes en `private.agrosignal_migrations`.
No editar SQL ya aplicado: agregar otra migración.

## Pendiente: proveedor de correo

Supabase no tiene SMTP personalizado. Su remitente predeterminado restringe
los destinatarios al equipo del proyecto, por lo que no permite registro
público con confirmación ni recuperación para usuarios externos.
Se solicitaron host, puerto, usuario, contraseña y remitente verificado.
No se desactivó la confirmación de correo para eludir esta limitación.

Referencia: [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).
Las pruebas de sesiones usan cuentas temporales y enlaces generados por la
API administrativa; no equivalen a verificar entrega de correo real.
