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

- Se revisaron los archivos del repositorio y las variables del proceso:
  no contienen credenciales reales de Supabase.
- El repo está vinculado al proyecto Vercel existente
  `rodrigor4mirezs-projects/agrosignal`. `vercel env ls` confirmó que
  no hay variables configuradas en el proyecto.
- `.env.local` contiene los nombres de `.env.example`, una URL y una clave
  pública de ejemplo. `SUPABASE_SERVICE_ROLE_KEY` está vacía. Estos valores
  solo permiten preparar el proyecto; no habilitan registro, persistencia ni
  pruebas con usuarios reales. El archivo está ignorado por git.
- Las migraciones de las siete tablas y los cuatro buckets están preparadas
  en `supabase/migrations/`; su ejecución remota está pendiente.
- No se publicaron las variables de ejemplo en Vercel.

### Acceso que falta para continuar

Configurar `SUPABASE_ACCESS_TOKEN` en `.env.local` con un token personal
de [Supabase → Account → Access Tokens](https://supabase.com/dashboard/account/tokens).
Se usará únicamente como credencial de administración para localizar el
proyecto, recuperar sus claves y aplicar las migraciones. No debe llevar
`NEXT_PUBLIC_`, incluirse en el cliente, subirse a git ni desplegarse en Vercel.
Si hay varios proyectos, se seleccionará el de AgroSignal por nombre;
si el nombre es distinto, indicar su referencia de proyecto.

Alternativa: proporcionar la URL, las claves de API y una conexión PostgreSQL
con permisos de migración mediante variables locales. La clave `service_role`
por sí sola no ofrece una conexión SQL para crear tablas.

Se solicitó este acceso mediante la excepción explícita de credenciales del
encargo. La ejecución se detiene antes de aplicar SQL remoto o iniciar los
módulos que necesitan datos reales; ningún módulo figura como terminado.
