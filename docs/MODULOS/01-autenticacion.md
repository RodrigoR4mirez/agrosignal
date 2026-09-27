# Módulo 1 — Autenticación y Roles

**Agente responsable:** `auth-roles` (ver `/AGENTS.md`)

## Qué problema resuelve

Hoy el sitio es 100% público (el dashboard de riesgo y el marketplace mock
"PRO"). Este módulo agrega usuarios reales con 3 roles distintos, cada uno
con su propia vista.

## Qué puede hacer cada rol

- **Admin**: entra a `/admin`, modera certificados, inspecciones de dron,
  disputas de pedidos.
- **Productor**: entra a `/panel-productor`, publica y gestiona sus lotes,
  ve sus ventas.
- **Comprador**: entra a `/panel-comprador`, compra lotes, ve sus pedidos
  y favoritos.

## Pantallas

- `/registro` — formulario con selección de rol (Productor o Comprador;
  Admin se asigna manualmente en la base de datos, nunca desde el
  formulario público).
- `/login`
- `/recuperar-password`
- Redirección automática post-login según `rol` en la tabla `perfiles`.

## Reglas de negocio

- El correo debe verificarse antes de poder publicar o comprar (navegar el
  marketplace sí se permite sin verificar).
- Un usuario con rol Productor no puede acceder a `/admin` ni
  `/panel-comprador`, y viceversa — si lo intenta, redirigir con mensaje
  "No tienes permiso para ver esta página".
- El middleware de protección de rutas revisa `perfiles.rol`, no solo si
  hay sesión activa.

## Estado

- [x] Tabla `perfiles` creada en Supabase
- [x] Formulario de registro con selección de rol
- [x] Login / logout
- [x] Recuperación de contraseña (flujo implementado; entrega de correo pendiente de SMTP)
- [x] Middleware de protección de rutas por rol (`proxy.ts` en Next.js 16)
- [x] Probado con los 3 roles (checklist de `qa-testing` en `/AGENTS.md`)

## Implementación — 26 de septiembre de 2026

Las migraciones 001–003 están aplicadas en Supabase real. La 003 crea el
perfil al registrarse: solo permite roles públicos `productor` o `comprador`,
ignora el rol `admin` en metadata pública y no concede escrituras directas en
`perfiles`. El rol administrativo se asigna manualmente mediante administración
segura de la base de datos. Cambiar metadata posteriormente no cambia el rol.

Registro en tres pasos con datos específicos por rol y validación en servidor.
Se conservan los datos del formulario si hay un error. Login, cierre de sesión,
confirmación y reenvío de correo, recuperación y cambio de contraseña tienen
mensajes en español. El cambio de contraseña cierra las sesiones.

Clientes Supabase SSR/browser usan la clave pública y la sesión del usuario.
`proxy.ts` actualiza cookies y protege rutas por rol, suspensión y verificación
de correo; la capa de acceso repite los controles en cada acción protegida.
El catálogo público permanece accesible. No se usa `service_role` en la app.

Se agregaron paneles mínimos de cuenta para los tres roles, navegación
compartida y `/ayuda`; los agentes siguientes ampliarán esos paneles con sus
funciones específicas.

### API compartida para los módulos siguientes

- `lib/supabase/server.ts`: `await createClient()` para consultas/acciones con RLS.
- `lib/supabase/client.ts`: `createClient()` para componentes del navegador.
- `lib/supabase/auth.ts`: `getProfile()` devuelve perfil + email/verificación o `null`;
  `await requireRole('productor' | 'comprador' | 'admin' | array)` exige sesión,
  cuenta activa, correo verificado y rol. Llamarlo dentro de cada acción y página.
- `lib/supabase/types.ts`: `Profile`, `UserRole`, `ActionState`, `ROLE_HOME`, `ROLE_LABEL`.
- `components/AppShell.tsx`: navegación accesible con Ayuda, panel y cierre de sesión.
- `components/auth/FormFields.tsx`: campos, estilos, estado de formulario reutilizables.

### Validación y pendientes

- [x] `npm run build` de producción sin errores ni warnings nuevos (26/09/2026).
- [x] 16 pruebas SQL aprobadas: aislamiento/RLS, perfil automático,
  intento de escalamiento a admin, metadata modificada, productor incompleto,
  usuario sin verificar y suspendido.
- [x] QA de login/logout con tres roles, registro por sus tres pasos y recuperación con enlace de QA contra Supabase real.
- [ ] Entrega real de correos de registro/recuperación (requiere SMTP).
- [x] QA responsive a 375px y 1440px, sin errores de consola ni desbordamiento horizontal.

SMTP personalizado sigue pendiente: no se desactiva la verificación y no se
afirma que los correos se entreguen. QA puede generar enlaces de confirmación
y recuperación con la API administrativa en un script privado, sin enviar
correos; la aplicación pública nunca usa esa API. Para plantillas de correo
entre dispositivos se admite `/auth/confirm?token_hash=…&type=signup` o
`type=recovery`. `/auth/callback` admite el intercambio PKCE estándar.

Referencia de integración SSR:
[documentación oficial Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client).


### Evidencia de QA — 26 de septiembre de 2026

Verificación local con `npm run dev`, Chromium y `agent-browser`, usando
cuentas exclusivas de QA y Supabase real. No se iniciaron funciones de los
módulos siguientes.

| Flujo | Resultado observado |
| --- | --- |
| Login y logout | Admin → `/admin`, Productor → `/panel-productor`, Comprador → `/panel-comprador`. `/mi-cuenta` resuelve al panel propio. Tras cerrar sesión, volver al panel exige login. |
| Protección por rol | Los seis cruces entre paneles regresan al panel propio con «No tienes permiso para ver esta página». |
| Acceso anónimo | `/admin`, ambos paneles, `/actualizar-password` y `/marketplace/publicar` redirigen a login con aviso; `/marketplace` permanece público. |
| Registro | Ambos roles públicos disponibles, sin opción Admin. Se completaron los tres pasos del productor. Una contraseña repetida distinta muestra el error en español y conserva los datos. El envío llega a Supabase, que rechaza el envío de correo con la configuración actual. |
| Confirmación | Cuenta QA creada con `generateLink` administrativo, solo desde script privado. Sin confirmar no puede ingresar. Abrir `/auth/confirm` con token de signup confirma el correo y abre el panel comprador; perfil y confirmación corroborados en Supabase. Reutilizar el enlace muestra aviso de enlace vencido/usado. |
| Recuperación y cambio | La solicitud pública de correo muestra el error de envío. Un enlace recovery de QA abre `/actualizar-password`; se verificó el error de contraseñas distintas, cambio real, cierre de sesión, rechazo de contraseña anterior y login con la nueva. Reutilizar recovery se rechaza. |
| Responsive y consola | Inspección visual de login, registro, cambio de contraseña y los tres paneles a 375 y 1440 px. Sin overlays, errores de navegador ni desbordamiento horizontal. |

Se corrigió el aviso de Next.js sobre `scroll-behavior: smooth` declarando
`data-scroll-behavior="smooth"` en el elemento raíz. El error compartido de
correo ahora dice «No pudimos enviar el correo» para servir tanto al registro
como a recuperación. Los mensajes que se mostraron no expusieron stack traces.

Capturas y resultados locales, excluidos de Git y del despliegue, están en
`.qa-artifacts/`: `login-{375,1440}.png`,
`{productor,comprador,admin}-{375,1440}.png`,
`registro-step1-{375,1440}.png`, `registro-submit-{375,1440}.png`,
`actualizar-password-{375,1440}.png` y `auth-results.json`.
Las capturas se toman después de terminar las transiciones de tamaño de las
tarjetas; en móvil el formulario mide 343 px dentro del viewport de 375 px.

La entrega SMTP sigue sin validarse. Los enlaces administrativos usados en QA
no demuestran entrega de correo y nunca se generan desde la aplicación pública.
Las credenciales de QA se mantienen únicamente en archivos locales ignorados.

### Comprobación en producción

El formulario de registro se envió desde `https://agrosignal.vercel.app` y
mostró «No pudimos enviar el correo» por la configuración SMTP pendiente.
Una cuenta exclusiva de QA se confirmó con un enlace administrativo privado
para completar publicación y compra. Login/logout y restricciones de los tres
roles pasaron en producción; no se acreditó entrega de correo externo.
Ver [RESUMEN-EJECUCION.md](../RESUMEN-EJECUCION.md).
