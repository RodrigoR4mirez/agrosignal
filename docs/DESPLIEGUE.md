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

## Despliegue verificado — 26 de septiembre de 2026

- Sesión Vercel validada y repo vinculado al proyecto existente `agrosignal`.
- URL de producción: https://agrosignal.vercel.app.
- Migraciones `20260926000100` a `20260926000700` ejecutadas en Supabase:
  siete tablas, cuatro buckets y reglas de los cinco módulos. Aplicación
  incremental mediante `scripts/supabase-management.mjs`, que registra el
  nombre y checksum de cada migración.
- Variables reales de Supabase y URL de sitio configuradas en producción.
  El token personal de administración no se desplegó.
- Confirmación de correo activa y redirecciones autorizadas para desarrollo
  local y producción. SMTP para destinatarios externos pendiente del proveedor.
- Los cinco módulos se publicaron con push a `main` después de su build y QA
  local. El pulido posterior también está publicado.

### Versión de producción

- URL estable: https://agrosignal.vercel.app.
- Despliegue: `dpl_9RHc5q2yzNhJ9ZV2mwWyppLoAyeL`.
- URL del artefacto:
  https://agrosignal-am0vrq2fc-rodrigor4mirezs-projects.vercel.app.
- Estado: **READY**, destino **Production**, framework **Next.js**.
- Origen: integración Git, rama `main`, commit
  `0edef0745dc2222900aa69079fe6c12e0061ee03`.
- Build remoto: **21,4 segundos**; compilación y comprobación de tipos
  completadas. No fue necesario un despliegue manual adicional.

### Variables y protección de datos

Verificados los nombres y el alcance Production de
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SITE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Esta última está
marcada como Secret. URL y clave pública coinciden con el proyecto real;
la URL de sitio es `https://agrosignal.vercel.app`.

La comprobación se hizo sin imprimir valores ni sobrescribir `.env.local`.
`SUPABASE_ACCESS_TOKEN` no está en Vercel. La aplicación usa sesiones y RLS;
no utiliza la clave de servicio para operar como usuarios.

### Comprobaciones de infraestructura

- HTTP 200 en inicio climático, fenómeno El Niño, marketplace, ayuda,
  registro, login y recuperación de contraseña.
- `/pro` redirige al marketplace; una ruta inexistente devuelve la página
  404 en español.
- Los tres paneles redirigen a login sin sesión. Con las cuentas QA de
  Admin, Productor y Comprador, sus paneles responden HTTP 200.
- Paneles autenticados: `Cache-Control: private, no-cache, no-store,
  max-age=0, must-revalidate` y `x-vercel-cache: MISS`. La redirección del
  panel admin sin sesión también lleva `private, no-store`.
- Escaneo final de logs de ejecución después del QA y del retiro de lotes
  de prueba, a las **21:55 del 26/09/2026 (Lima)**: **0 errores y
  0 advertencias**, consulta de la última hora del despliegue.
  Seguimiento disponible mediante Vercel CLI y Dashboard.
  No hay drains externos configurados; no se contrataron servicios nuevos.

La instalación de dependencias en Vercel emite un aviso no bloqueante de
npm: `unrs-resolver@1.12.2` tiene un `postinstall` no cubierto por
`allowScripts`. Es una dependencia de desarrollo de ESLint que prepara el
binario nativo; el build finaliza correctamente con los paquetes opcionales
del lock. No se habilitaron scripts adicionales ni se cambiaron dependencias
para ocultar el aviso.

### QA funcional en producción

Probado en la URL estable con datos reales de Supabase y Storage:

- Registro desde la UI: el envío de confirmación encontró la restricción
  del proveedor de correo actual. Se verificó el mensaje de error en español.
  Una cuenta QA se confirmó mediante un enlace administrativo privado para
  continuar el resto del recorrido.
- Login y cierre de sesión de los tres roles, con protección de rutas.
- Publicación de un lote de prueba y subida de su foto JPEG desde el navegador.
- Compra de **7 kg por S/ 38,50**: pendiente → confirmado → enviado →
  recibido → calificado, con calificación de **5/5**. El stock pasó de
  **100 a 93 kg** al confirmar el productor.
- Vistas de **375 px y 1440 px**, sin errores de consola en el recorrido.

El envío de correos a destinatarios externos sigue pendiente de SMTP
personalizado. No se desactivó la confirmación de correo; la confirmación
asistida valida el enlace y la sesión, pero no acredita la entrega de mensajes.
Los lotes QA se retiraron del catálogo: los dos lotes aprobados quedaron con
stock cero y el lote con resultado «No pasa» conserva su bloqueo. Las consultas
públicas no muestran ninguno de los tres. Se preservaron los pedidos y las
evidencias de prueba para no alterar el historial inmutable.

El QA de producción y la revisión final de logs están completados; la única
limitación del recorrido de alta es la entrega de correo pendiente de SMTP.
