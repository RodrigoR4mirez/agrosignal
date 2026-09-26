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

- [ ] Tabla `perfiles` creada en Supabase
- [ ] Formulario de registro con selección de rol
- [ ] Login / logout
- [ ] Recuperación de contraseña
- [ ] Middleware de protección de rutas por rol
- [ ] Probado con los 3 roles (checklist de `qa-testing` en `/AGENTS.md`)

## Pendiente previo — 26 de septiembre de 2026

La tabla está definida en `supabase/migrations/20260926000100_esquema_inicial.sql`,
pero no fue creada en Supabase remoto. Falta el acceso de administración
solicitado en `../VARIABLES-DE-ENTORNO.md`. El módulo no se inició y no se
han probado registro, login ni roles en el navegador.
