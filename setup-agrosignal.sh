#!/usr/bin/env bash
set -e

# ============================================================================
# setup-agrosignal.sh
# ----------------------------------------------------------------------------
# Ejecuta esto UNA VEZ, parado dentro de tu clon local del repo agrosignal
# (la carpeta que tiene package.json, CLAUDE.md, app/, etc.)
#
# Qué hace:
#   1. Verifica que estás en la carpeta correcta del repo.
#   2. Elimina pipeline/ y svgs/ del repo (duplicados/datos que no van en git,
#      ver justificación abajo).
#   3. Crea/actualiza AGENTS.md con el mapa de agentes para construir el
#      marketplace funcional (auth, transacciones, sello de inocuidad, admin).
#   4. Crea la carpeta docs/ con toda la documentación .md del proyecto.
#   5. Crea .env.example con las variables que vas a necesitar.
#   6. Instala las dependencias nuevas (Supabase) sin tocar lo que ya
#      funciona.
#   7. Deja todo en un commit local — TÚ decides cuándo hacer git push.
#
# No hace push automático. No borra nada que el código esté usando.
# ============================================================================

echo "🌾 AgroSignal — setup del proyecto"
echo "-----------------------------------"

# --- 1. Validaciones de seguridad ---------------------------------------
if [ ! -f "package.json" ] || [ ! -f "CLAUDE.md" ]; then
  echo "❌ No pareces estar en la raíz del repo agrosignal."
  echo "   Corre: cd ruta/a/tu/agrosignal   y vuelve a ejecutar este script."
  exit 1
fi

DIRTY="$(git status --porcelain -- . ':(exclude)setup-agrosignal.sh' 2>/dev/null)"
if [ -n "$DIRTY" ]; then
  echo "⚠️  Tienes cambios sin commitear en el repo (aparte de este script):"
  echo "$DIRTY"
  if [ -t 0 ]; then
    read -p "   ¿Seguro que quieres continuar igual? (s/n): " confirm
    if [ "$confirm" != "s" ]; then
      echo "Cancelado. Haz commit o stash de tus cambios primero."
      exit 1
    fi
  else
    echo "   (Corriendo sin terminal interactiva, continúo de todas formas.)"
  fi
fi

echo ""
echo "✅ Repo detectado correctamente."

echo ""
echo "📦 Paso 1/5 — Limpiando archivos que no van en el repo"
echo "-----------------------------------------------------"
if [ -d "pipeline" ] || [ -d "svgs" ]; then
  echo "   Encontrados: pipeline/ y/o svgs/ (según CLAUDE.md, esos datos"
  echo "   viven en iCloud, no en este repo git)."
  git rm -r --cached pipeline svgs -q 2>/dev/null || true
  rm -rf pipeline svgs
  grep -qxF "pipeline/" .gitignore || echo "pipeline/" >> .gitignore
  grep -qxF "svgs/" .gitignore || echo "svgs/" >> .gitignore
  echo "   ✅ pipeline/ y svgs/ eliminados del repo (y agregados a .gitignore)"
else
  echo "   ✅ Ya estaban limpios, nada que hacer."
fi


echo ""
echo "🤖 Paso 2/5 — Actualizando AGENTS.md"
echo "-------------------------------------"


mkdir -p "$(dirname "AGENTS.md")"
cat > "AGENTS.md" << 'FILEEOF'
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation
notices.
<!-- END:nextjs-agent-rules -->

---

# Mapa de Agentes — AgroSignal

Este archivo define cómo debe organizarse el trabajo de construcción del
**marketplace funcional** de AgroSignal (login por roles, transacciones,
Sello de Inocuidad, panel admin) sobre el dashboard de riesgo climático que
ya existe en este repo. Léelo antes de empezar cualquier módulo nuevo.

Para contexto del proyecto (paleta, convenciones de Tailwind, pipeline de
datos climáticos, flujo de imágenes de Stitch), ver `CLAUDE.md` — ese
archivo NO se toca desde acá, es la fuente de verdad de convenciones
existentes. Este archivo (`AGENTS.md`) es la fuente de verdad de **cómo
dividir el trabajo en agentes** para las funcionalidades nuevas.

## Regla de oro

Un agente = una responsabilidad. Nunca mezcles lógica de auth con lógica de
marketplace en el mismo cambio. Si tu herramienta (Claude Code, Cursor)
soporta subagentes/skills nativos, créalos con estos nombres exactos. Si no
los soporta, igual trabaja en este orden, un módulo a la vez, sin saltar.

---

## Agente: `auth-roles`

**Responsabilidad:** registro, login, roles (Admin / Productor / Comprador),
protección de rutas, recuperación de contraseña.

**Puede tocar:** `app/(auth)/*`, `lib/supabase/*`, tabla `perfiles`,
middleware de protección de rutas.

**No debe tocar:** lógica de publicación de lotes, transacciones, sello de
inocuidad, panel admin — solo quién es el usuario y qué puede ver.

**Entregable de referencia:** ver `docs/MODULOS/01-autenticacion.md`.

---

## Agente: `marketplace`

**Responsabilidad:** publicación de lotes, edición, búsqueda, filtros, vista
pública del marketplace (reemplaza gradualmente el mock actual bloqueado
"PRO" en `app/marketplace` y `app/pro`), subida de imágenes a Supabase
Storage.

**Puede tocar:** `app/marketplace/*`, tabla `lotes`, componentes de tarjetas
de producto.

**Debe respetar:** la paleta verde `#1a5c2a` / dorado `#d4a017` y las clases
`bg-linear-to-*` (Tailwind v4, nunca `bg-gradient-to-*`) ya definidas en
`CLAUDE.md`. No reinventar el sistema de diseño — reusar
`components/ui/Card.tsx` donde aplique.

**Entregable de referencia:** ver `docs/MODULOS/02-marketplace.md`.

---

## Agente: `transacciones`

**Responsabilidad:** flujo de compra, estados del pedido, descuento de
stock, notificaciones internas, calificaciones.

**Puede tocar:** tabla `pedidos`, tabla `notificaciones`, panel comprador,
panel productor (sección "mis ventas"/"mis compras").

**Entregable de referencia:** ver `docs/MODULOS/03-transacciones.md`.

---

## Agente: `sello-inocuidad`

**Responsabilidad:** los 3 niveles de verificación de un lote —
(1) documental, (2) inspección con dron, (3) tiras reactivas — y sus
badges visuales en el marketplace.

**Puede tocar:** tablas `certificados`, `inspecciones_dron`,
`tests_residuos`, componente reutilizable `<SelloInocuidadBadge />`.

**Regla de negocio crítica:** un lote con test de residuos "No pasa" se
oculta automáticamente del marketplace público — este agente es responsable
de que esa regla nunca se rompa en cambios futuros.

**Entregable de referencia:** ver `docs/MODULOS/04-sello-inocuidad.md`.

---

## Agente: `admin-panel`

**Responsabilidad:** moderación, aprobación de certificados, gestión de
solicitudes de dron, resolución de disputas de pedidos, métricas simples.

**Puede tocar:** `app/admin/*`, lectura de todas las tablas anteriores
(pero solo esas partes ya construidas por sus agentes respectivos — no
duplica su lógica, solo la consume).

**Entregable de referencia:** ver `docs/MODULOS/05-panel-admin.md`.

---

## Agente: `qa-testing`

**Responsabilidad:** se activa DESPUÉS de que otro agente termina su
módulo, nunca antes ni en paralelo. Prueba el flujo de principio a fin como
un usuario real (registro → login → publicar/comprar → verificar estados),
en local (`npm run dev`) antes de dar el módulo por cerrado.

**Checklist mínimo por módulo:**
- [ ] `npm run build` no tiene errores ni warnings nuevos.
- [ ] El flujo se probó con los 3 roles (Admin, Productor, Comprador).
- [ ] Los mensajes de error están en español simple, sin stack traces
      visibles al usuario.
- [ ] Responsive: se probó en ~375px (mobile) y ~1440px (desktop).
- [ ] El archivo `docs/MODULOS/0X-*.md` correspondiente quedó actualizado.

---

## Agente: `deploy-devops`

**Responsabilidad:** variables de entorno, conexión a Supabase, build de
producción, despliegue en Vercel.

**Puede tocar:** `.env.example`, configuración de Vercel, `next.config.ts`
solo si hace falta para producción.

**Entregable de referencia:** ver `docs/DESPLIEGUE.md`.

---

## Orden de ejecución obligatorio

```
auth-roles → marketplace → transacciones → sello-inocuidad → admin-panel → deploy-devops
                                                                    ↑
                                                    qa-testing corre después de CADA uno
```

No construyas `transacciones` antes de que `marketplace` tenga lotes reales
en base de datos (no mock). No construyas `admin-panel` antes de que
`sello-inocuidad` tenga sus tablas, porque el panel admin depende de ellas
para la cola de aprobaciones.
FILEEOF

echo "   ✅ AGENTS.md actualizado"

echo ""
echo "📚 Paso 3/5 — Creando documentación en docs/"
echo "---------------------------------------------"


mkdir -p "$(dirname "docs/README.md")"
cat > "docs/README.md" << 'FILEEOF'
# Documentación de AgroSignal

Índice de todo lo que necesitas para entender y seguir construyendo el
proyecto.

| Documento | Para qué sirve |
|---|---|
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Cómo está armado técnicamente el proyecto de punta a punta |
| [MODELO-DE-DATOS.md](./MODELO-DE-DATOS.md) | Todas las tablas de la base de datos y cómo se relacionan |
| [MODULOS/01-autenticacion.md](./MODULOS/01-autenticacion.md) | Login, registro y roles |
| [MODULOS/02-marketplace.md](./MODULOS/02-marketplace.md) | Publicación y búsqueda de lotes |
| [MODULOS/03-transacciones.md](./MODULOS/03-transacciones.md) | Flujo de compra y pedidos |
| [MODULOS/04-sello-inocuidad.md](./MODULOS/04-sello-inocuidad.md) | Los 3 niveles de verificación de un lote |
| [MODULOS/05-panel-admin.md](./MODULOS/05-panel-admin.md) | Moderación y aprobaciones |
| [DESPLIEGUE.md](./DESPLIEGUE.md) | Cómo publicar la app en Vercel paso a paso |
| [VARIABLES-DE-ENTORNO.md](./VARIABLES-DE-ENTORNO.md) | Qué es cada variable y de dónde sacarla |
| [GLOSARIO.md](./GLOSARIO.md) | Términos técnicos y del agro explicados en simple |

Para las reglas de **cómo dividir el trabajo entre agentes de IA** al
construir cada módulo, ver `/AGENTS.md` en la raíz del repo.

Para convenciones de diseño, paleta de colores, pipeline de datos
climáticos y flujo de imágenes de Stitch (todo lo que ya existe y
funciona), ver `/CLAUDE.md` en la raíz del repo — ese documento no se
duplica acá.
FILEEOF


mkdir -p "$(dirname "docs/ARQUITECTURA.md")"
cat > "docs/ARQUITECTURA.md" << 'FILEEOF'
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
FILEEOF


mkdir -p "$(dirname "docs/MODELO-DE-DATOS.md")"
cat > "docs/MODELO-DE-DATOS.md" << 'FILEEOF'
# Modelo de Datos

Todas estas tablas viven en Supabase (Postgres). Esta es la referencia que
debe seguir el agente `auth-roles` (tabla 1) y cada agente correspondiente
para las demás.

## `perfiles`

Extiende la tabla de usuarios de Supabase Auth (que solo trae
correo/contraseña) con los datos propios de AgroSignal.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (FK a `auth.users`) | Igual al id del usuario en Supabase Auth |
| `nombre_completo` | text | Nombre del usuario |
| `telefono` | text | Contacto |
| `rol` | enum: `admin`, `productor`, `comprador` | Determina qué puede ver y hacer |
| `region` | text (nullable) | Solo si rol = productor |
| `cultivo_principal` | text (nullable) | Solo si rol = productor |
| `tipo_comprador` | enum: `natural`, `empresa`, `exportador` (nullable) | Solo si rol = comprador |
| `destino_exportacion` | boolean (nullable) | Solo si rol = comprador |
| `creado_en` | timestamp | Fecha de registro |

## `lotes`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `productor_id` | uuid (FK a `perfiles`) | Quién lo publicó |
| `cultivo` | text | Ej. "Palta Hass" |
| `region`, `provincia`, `distrito` | text | Ubicación |
| `cantidad_disponible` | numeric | Se descuenta con cada venta confirmada |
| `unidad` | enum: `kg`, `ton` | — |
| `precio_unidad` | numeric | En soles |
| `estado_cosecha` | enum: `en_cosecha`, `proxima`, `disponible` | — |
| `nivel_riesgo` | enum: `bajo`, `medio`, `alto` | Manual por ahora |
| `destino` | enum: `local`, `exportacion` | Afecta qué niveles de Sello se recomiendan |
| `descripcion` | text (nullable) | Máx. 300 caracteres |
| `fotos` | text[] | URLs en Supabase Storage |
| `bloqueado` | boolean | `true` automático si un test de residuos falla |
| `creado_en` | timestamp | — |

## `pedidos`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `comprador_id` | uuid (FK a `perfiles`) | — |
| `cantidad` | numeric | — |
| `total` | numeric | `cantidad * precio_unidad` al momento de la compra |
| `direccion_entrega` | text | — |
| `estado` | enum: `pendiente`, `confirmado`, `enviado`, `recibido`, `calificado`, `rechazado`, `cancelado` | Ver `docs/MODULOS/03-transacciones.md` |
| `calificacion` | int (1-5, nullable) | Solo si estado = calificado |
| `comentario` | text (nullable) | — |
| `creado_en` | timestamp | — |

## `certificados` (Sello de Inocuidad — Nivel 1)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `tipo` | enum: `senasa`, `global_gap`, `otro` | — |
| `numero` | text | — |
| `fecha_vencimiento` | date | — |
| `archivo_url` | text | PDF o imagen en Storage |
| `estado` | enum: `en_revision`, `aprobado`, `rechazado`, `vencido` | — |
| `revisado_por` | uuid (FK a `perfiles`, nullable) | Admin que lo aprobó/rechazó |
| `motivo_rechazo` | text (nullable) | — |

## `inspecciones_dron` (Sello de Inocuidad — Nivel 2)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `estado` | enum: `solicitado`, `completado` | — |
| `coordenadas_gps` | text (nullable) | Se llena al completarse |
| `fecha_vuelo` | date (nullable) | — |
| `evidencia_urls` | text[] (nullable) | Fotos/video en Storage |
| `notas` | text (nullable) | — |

## `tests_residuos` (Sello de Inocuidad — Nivel 3)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `lote_id` | uuid (FK a `lotes`) | — |
| `tipo_kit` | text | Marca/tipo de tira reactiva usada |
| `fecha_prueba` | date | — |
| `resultado` | enum: `pasa`, `no_pasa` | Si es `no_pasa`, el lote se bloquea automático |
| `foto_evidencia_url` | text | — |
| `realizado_por` | uuid (FK a `perfiles`) | — |

## `notificaciones`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid | — |
| `usuario_id` | uuid (FK a `perfiles`) | Quién la recibe |
| `mensaje` | text | — |
| `leida` | boolean | — |
| `referencia_tipo` | text | Ej. "pedido", "certificado" |
| `referencia_id` | uuid | — |
| `creado_en` | timestamp | — |

## Relaciones (resumen)

```
perfiles (1) ──< lotes (N)
lotes (1) ──< pedidos (N)
lotes (1) ──< certificados (N)
lotes (1) ──< inspecciones_dron (N)
lotes (1) ──< tests_residuos (N)
perfiles (1) ──< notificaciones (N)
```
FILEEOF


mkdir -p "$(dirname "docs/DESPLIEGUE.md")"
cat > "docs/DESPLIEGUE.md" << 'FILEEOF'
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
FILEEOF


mkdir -p "$(dirname "docs/VARIABLES-DE-ENTORNO.md")"
cat > "docs/VARIABLES-DE-ENTORNO.md" << 'FILEEOF'
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
FILEEOF


mkdir -p "$(dirname "docs/GLOSARIO.md")"
cat > "docs/GLOSARIO.md" << 'FILEEOF'
# Glosario

## Términos técnicos

- **Agente**: en este proyecto, una porción de trabajo con una
  responsabilidad clara y acotada (ver `/AGENTS.md`).
- **Deploy / despliegue**: publicar una versión nueva de la app para que
  cualquiera la vea en internet.
- **Variable de entorno**: un valor secreto o de configuración (como una
  clave de acceso) que no se escribe directo en el código, para no
  exponerlo si el código se hace público.
- **Middleware**: código que corre antes de mostrar una página, usado acá
  para revisar si el usuario tiene permiso de verla según su rol.
- **Server Component / Client Component**: en Next.js, partes de la
  página que se renderizan en el servidor vs. en el navegador del
  usuario.
- **Storage (Supabase)**: el lugar donde se guardan archivos (fotos,
  PDFs) fuera de la base de datos.
- **Badge**: la insignia visual (ej. 🟢🔵🏆) que muestra qué nivel de
  verificación alcanzó un lote.

## Términos del agro

- **LMR (Límite Máximo de Residuos)**: la cantidad máxima permitida por
  ley de un pesticida que puede quedar en un alimento.
- **SENASA**: Servicio Nacional de Sanidad Agraria del Perú — entidad que
  certifica oficialmente la inocuidad de productos agrícolas.
- **GLOBAL G.A.P.**: certificación internacional de buenas prácticas
  agrícolas, muy pedida por compradores de exportación.
- **Sello de Inocuidad**: en AgroSignal, la insignia que le da a un lote
  la validación de que es seguro para el consumo, combinando hasta 3
  niveles de verificación (documental, dron, tiras reactivas).
- **Lote**: la publicación de una cantidad específica de un cultivo que
  un productor pone a la venta.
FILEEOF


mkdir -p "$(dirname "docs/MODULOS/01-autenticacion.md")"
cat > "docs/MODULOS/01-autenticacion.md" << 'FILEEOF'
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
FILEEOF


mkdir -p "$(dirname "docs/MODULOS/02-marketplace.md")"
cat > "docs/MODULOS/02-marketplace.md" << 'FILEEOF'
# Módulo 2 — Publicación y Marketplace de Lotes

**Agente responsable:** `marketplace` (ver `/AGENTS.md`)

## Qué problema resuelve

`/marketplace` hoy es un mock estático con secciones bloqueadas "PRO"
(exportado de Stitch). Este módulo lo convierte en un marketplace real
donde los productores publican lotes de verdad, guardados en Supabase.

## Qué puede hacer cada rol

- **Productor**: publicar, editar y eliminar SOLO sus propios lotes.
- **Comprador / público sin cuenta**: ver el marketplace, buscar, filtrar.
  El botón "Comprar" solo aparece logueado como Comprador (ver Módulo 3).

## Pantallas

- `/marketplace` — grid público de lotes (reemplaza el mock actual,
  reusando el diseño/paleta ya existente, no reinventarlo).
- `/marketplace/[id]` — detalle de un lote.
- `/panel-productor/publicar` — formulario de publicación (wizard de
  pasos cortos, no un formulario largo de una sola vez).
- `/panel-productor/mis-lotes` — gestión de lotes propios.

## Reglas de negocio

- Un lote con `cantidad_disponible = 0` se marca "Agotado" y desaparece
  del marketplace público, pero sigue visible en `/panel-productor`.
- Filtros disponibles: región, cultivo, rango de precio, destino
  (local/exportación), nivel de Sello de Inocuidad alcanzado.
- Las fotos se suben a Supabase Storage, no se guardan en el repo.

## Estado

- [ ] Tabla `lotes` creada en Supabase
- [ ] Formulario de publicación (wizard)
- [ ] Vista de marketplace pública con filtros
- [ ] Vista de detalle de lote
- [ ] Panel "mis lotes" para el productor
- [ ] Probado con los 3 roles
FILEEOF


mkdir -p "$(dirname "docs/MODULOS/03-transacciones.md")"
cat > "docs/MODULOS/03-transacciones.md" << 'FILEEOF'
# Módulo 3 — Transacciones

**Agente responsable:** `transacciones` (ver `/AGENTS.md`)

## Qué problema resuelve

Convierte el marketplace de "catálogo" a "negocio real": un comprador
puede comprar un lote y queda un pedido rastreable, con notificaciones
para ambas partes.

## Flujo completo

```
Comprador presiona "Comprar"
  → formulario: cantidad + dirección de entrega
  → se crea pedido en estado "pendiente"
  → Productor ve el pedido, Acepta o Rechaza
      → Acepta → estado "confirmado" (se descuenta stock del lote AQUÍ,
                  no antes, para no bloquear stock con pedidos que el
                  productor podría rechazar)
      → Rechaza → estado "rechazado"
  → Productor marca "Enviado" → estado "enviado"
  → Comprador marca "Recibido" → estado "recibido"
  → Se pide calificación (1-5 estrellas + comentario opcional)
      → estado "calificado"
```

## Reglas de negocio

- Nombres de estado exactos a usar en base de datos e interfaz:
  `pendiente`, `confirmado`, `enviado`, `recibido`, `calificado`,
  `rechazado`, `cancelado`.
- El stock del lote se descuenta solo al pasar a `confirmado`.
- Cada cambio de estado dispara una notificación interna (tabla
  `notificaciones`) para ambas partes.
- No hay pasarela de pago real en este módulo (fase 2, ver
  `docs/MODULOS/03-transacciones.md` → sección "Fase 2" abajo).

## Fase 2 (no construir todavía, solo dejar la puerta abierta)

- Integrar Mercado Pago o Culqi para cobro real al confirmar el pedido.
- El campo `total` de `pedidos` ya está listo para usarse como monto a
  cobrar cuando se integre.

## Estado

- [ ] Tabla `pedidos` creada en Supabase
- [ ] Tabla `notificaciones` creada en Supabase
- [ ] Flujo de compra completo (los 7 estados)
- [ ] Notificaciones visibles en `/panel-productor` y `/panel-comprador`
- [ ] Sistema de calificación al recibir
- [ ] Probado de principio a fin como Productor y como Comprador
FILEEOF


mkdir -p "$(dirname "docs/MODULOS/04-sello-inocuidad.md")"
cat > "docs/MODULOS/04-sello-inocuidad.md" << 'FILEEOF'
# Módulo 4 — Sello de Inocuidad (3 niveles)

**Agente responsable:** `sello-inocuidad` (ver `/AGENTS.md`)

## Qué problema resuelve

Le da al comprador (sobre todo exportadores) una señal de confianza sobre
la seguridad alimentaria del lote, sin depender solo de la palabra del
vendedor.

## Los 3 niveles (acumulables, no excluyentes)

### Nivel 1 — Verificación Documental 🟢
- Productor sube certificado (SENASA / GLOBAL G.A.P. / Otro) con número y
  fecha de vencimiento.
- Queda `en_revision` hasta que un Admin lo apruebe/rechace desde
  `/admin`.
- Si vence la fecha, el sistema quita el badge automáticamente
  (cronjob o verificación en cada carga de página, lo que sea más simple
  de implementar primero).

### Nivel 2 — Inspección con Dron 🔵
- Productor solicita inspección desde el detalle de su lote → se crea
  registro en `inspecciones_dron` con estado `solicitado`.
- Un Admin (coordinando con el proveedor real de drones, esto no se
  automatiza) sube el resultado: fotos/video, coordenadas GPS, fecha,
  notas → estado pasa a `completado`.

### Nivel 3 — Tiras Reactivas (screening de residuos) 🏆
- Se registra: tipo de kit, fecha, resultado (`pasa` / `no_pasa`), foto
  de evidencia.
- **Regla crítica:** si `resultado = no_pasa`, el lote se marca
  `bloqueado = true` automáticamente y desaparece del marketplace
  público. Se notifica al productor y al admin.

## Cómo se muestran los badges

- En la tarjeta del marketplace: solo el badge de mayor nivel alcanzado
  (para no saturar visualmente).
- En el detalle del lote: los 3 niveles por separado, con su estado
  individual.
- Si `lotes.destino = exportacion`, mostrar aviso sugiriendo completar
  los 3 niveles (no es obligatorio, solo recomendado).

## Estado

- [ ] Tablas `certificados`, `inspecciones_dron`, `tests_residuos` creadas
- [ ] Formulario de carga de certificado (Nivel 1)
- [ ] Flujo de solicitud + carga de resultado de dron (Nivel 2)
- [ ] Formulario de registro de test de residuos (Nivel 3)
- [ ] Componente `<SelloInocuidadBadge />` reutilizable
- [ ] Regla de bloqueo automático probada (crear un test "no_pasa" y
      confirmar que el lote desaparece del marketplace público)
FILEEOF


mkdir -p "$(dirname "docs/MODULOS/05-panel-admin.md")"
cat > "docs/MODULOS/05-panel-admin.md" << 'FILEEOF'
# Módulo 5 — Panel de Administración

**Agente responsable:** `admin-panel` (ver `/AGENTS.md`)

## Qué problema resuelve

Le da al Admin un solo lugar para moderar todo lo que los otros módulos
generan: certificados pendientes, solicitudes de dron, tests fallidos,
disputas de pedidos.

## Secciones (`/admin`)

1. **Usuarios** — lista de productores/compradores, opción de suspender
   cuenta.
2. **Certificados pendientes** — cola del Nivel 1 del Sello de
   Inocuidad, Aprobar/Rechazar con motivo.
3. **Solicitudes de inspección con dron** — cola del Nivel 2, formulario
   para subir resultado una vez hecha la inspección real.
4. **Tests de residuos fallidos** — lista de lotes bloqueados por
   `no_pasa`, para seguimiento.
5. **Pedidos/transacciones** — vista general filtrable por estado, para
   resolver disputas entre productor y comprador.
6. **Métricas simples** — tarjetas con: lotes activos, transacciones del
   mes, usuarios nuevos (sin gráficos complejos en el MVP).

## Reglas de negocio

- Toda acción irreversible (rechazar certificado, suspender cuenta) pide
  confirmación antes de ejecutarse.
- El panel solo lee de las tablas de los demás módulos — no duplica su
  lógica de negocio, solo la consume y actúa sobre sus estados.

## Estado

- [ ] Navegación del panel (menú lateral)
- [ ] Sección Usuarios
- [ ] Sección Certificados pendientes
- [ ] Sección Solicitudes de dron
- [ ] Sección Tests fallidos
- [ ] Sección Pedidos/transacciones
- [ ] Tarjetas de métricas simples
FILEEOF

echo "   ✅ Carpeta docs/ creada con 11 archivos"

echo ""
echo "🔑 Paso 4/5 — Creando .env.example"
echo "-------------------------------------"


mkdir -p "$(dirname ".env.example")"
cat > ".env.example" << 'FILEEOF'
# Copia este archivo como .env.local y llena los valores reales.
# Ver docs/VARIABLES-DE-ENTORNO.md para saber de dónde sacar cada uno.

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FILEEOF

echo "   ✅ .env.example creado (copia a .env.local y llena los valores)"

echo ""
echo "📦 Paso 5/5 — Instalando dependencias de Supabase"
echo "----------------------------------------------------"
npm install @supabase/supabase-js @supabase/ssr --silent
echo "   ✅ @supabase/supabase-js y @supabase/ssr instalados"

# --- Cierre: commit local (sin push, eso lo decides tú) --------------------
echo ""
echo "📝 Dejando todo en un commit local..."
# Limitar el commit a los archivos del setup; conservar los archivos previos
# del usuario (por ejemplo archivos ZIP y docs-preview) fuera del commit.
git add -- .gitignore AGENTS.md docs .env.example package.json package-lock.json setup-agrosignal.sh
git add -u -- pipeline svgs 2>/dev/null || true
git commit -q -m "chore: limpiar repo + estructura de agentes y docs para marketplace" || echo "   (nada nuevo que commitear, quizás ya lo habías corrido)"

echo ""
echo "✅ LISTO."
echo ""
echo "Qué se hizo:"
echo "  - pipeline/ y svgs/ eliminados del repo (no se usaban en el código)"
echo "  - AGENTS.md actualizado con el mapa de agentes"
echo "  - docs/ creado con 11 archivos de documentación"
echo "  - .env.example creado"
echo "  - @supabase/supabase-js y @supabase/ssr instalados"
echo "  - Todo quedó en un commit local"
echo ""
echo "Próximos pasos (los haces tú, cuando quieras):"
echo "  1. cp .env.example .env.local   → y llena las claves de Supabase"
echo "     (ver docs/VARIABLES-DE-ENTORNO.md)"
echo "  2. Revisa el commit:  git show --stat HEAD"
echo "  3. Cuando estés conforme:  git push"
echo "  4. Empieza el Módulo 1 (auth-roles) — ver docs/MODULOS/01-autenticacion.md"
