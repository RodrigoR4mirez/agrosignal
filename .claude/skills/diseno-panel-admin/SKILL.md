---
name: diseno-panel-admin
description: Diseño visual "Planta tras el vidrio" del panel de administración de AgroSignal (rutas /admin y archivos app/admin/* y components/admin/*). Úsala SIEMPRE antes de crear o modificar cualquier vista, componente o estilo del panel admin, incluida la gestión de usuarios. No aplica al marketplace, la landing, los paneles de productor y comprador, auth ni ninguna otra parte del sitio.
---

# Diseño del panel admin — "Planta tras el vidrio"

Esta skill es la **única fuente de verdad** del aspecto del panel de administración. Define un
fondo de planta desenfocada detrás de superficies de vidrio esmerilado, y nada más: la tipografía,
los textos, los botones, los colores de estado y la estructura de cada página siguen siendo los
del resto del sitio (`AGENTS.md` → "Diseño" y `components/ui/estilos.ts`).

Referencias en `references/`:
- `tema-admin.css` — hoja de estilos completa, lista para copiar a `app/admin/tema-admin.css`.
- `FondoFollaje.tsx` — componente del fondo, listo para copiar a `components/admin/FondoFollaje.tsx`.
- `fase-1.patch` — la Fase 1 completa como parche de git, probada (lint, tsc y build sin errores).
- `resultado-real-escritorio.png`, `resultado-real-movil.png` — cómo se ve con los componentes reales.
- `prototipo-admin-usuarios.html` — prototipo de referencia del ambiente (abrir en el navegador).

---

## 1. Alcance

| Sí aplica | No aplica (no tocar su aspecto) |
|---|---|
| `/admin`, `/admin/usuarios`, `/admin/vendedores`, `/admin/transacciones`, `/admin/pedidos`, `/admin/pedidos/[id]`, `/admin/certificados`, `/admin/drones`, `/admin/tests`, `/admin/mensajes` | `/` (landing), `/marketplace/*`, `/panel-productor/*`, `/panel-comprador/*`, `/(auth)/*`, `/verificaciones/*`, `/pedidos/*`, `/ayuda`, `/contacto`, `/compradores/*` |
| Archivos `app/admin/**` y `components/admin/**` | Todo lo demás en `app/` y `components/` |

El diseño se activa **solo** porque `app/admin/layout.tsx` envuelve el panel en
`<div className="tema-admin">`. Todo selector de `tema-admin.css` empieza por `.tema-admin`, así que
fuera del panel no tiene ningún efecto, aunque el navegador conserve la hoja al navegar.

## 2. Reglas de oro (no romper nada)

1. **Solo aspecto.** Nunca cambiar: server actions (`app/admin/actions.ts`), `requireRole`, funciones
   de `lib/**`, consultas, `searchParams`, campos ocultos (`version_esperada`, `idempotencia`, etc.),
   validaciones (`required`, `minLength`…), textos, enlaces, orden de elementos, paginación, `aria-*` ni `role`.
2. **Solo AÑADIR clases, nunca quitar.** Para dar vidrio a un contenedor del admin se agrega `adm-vidrio`
   (o `adm-nav`) **delante** de sus clases actuales. Las clases existentes (`bg-white`, `border-linea`…)
   se quedan: si la hoja del tema no cargara, todo se ve exactamente como antes.
3. **No editar archivos compartidos.** Prohibido modificar para este diseño: `components/AppShell.tsx`,
   `components/SitePie.tsx`, `components/ui/Card.tsx`, `components/ui/estilos.ts`,
   `components/auth/FormFields.tsx`, `components/ActionFeedback.tsx`, `components/transacciones/*`,
   `components/sello/*`, `components/calificaciones/*`, `components/contacto/*`, `app/globals.css`,
   `app/layout.tsx`. Su aspecto dentro del admin se ajusta solo desde `tema-admin.css` con selectores
   `.tema-admin …` (ya incluido: `.card-surface`, `header.sticky` y los avisos sin leer de `Notifications`, `li.bg-crema`).
4. **Tokens solo en `tema-admin.css`.** No escribir colores, desenfoques ni sombras del tema sueltos en
   los componentes. Si hace falta un valor nuevo, se agrega como variable `--adm-*` en esa hoja.
5. **Lo que no cambia en el admin:** fuente Plus Jakarta Sans, escala de títulos (`tituloPagina`,
   `tituloBloque`, `tituloItem`), botones de `estilos.ts` (principal naranja con texto petróleo,
   secundario de contorno, destructivos rojos), estados con `TONOS`, chips de estado, aviso verde de
   `ActionFeedback`, pie del sitio (`SitePie`, banda petróleo), menú activo petróleo de `AdminNav`.

## 3. Relación con otros documentos (para que no haya conflicto)

- `AGENTS.md` → "Diseño" rige todo el sitio. Esta skill es su **única excepción**, y solo para el
  **fondo y las superficies** dentro de `/admin`. Para todo lo demás dentro de `/admin`, sigue mandando `AGENTS.md`.
- **Prioridad sobre otras skills o guías de diseño** (por ejemplo `apple-design`, `frontend-design` o
  cualquier otra instalada): dentro de `/admin`, en fondo y superficies, **gana esta skill**. Si otra
  skill propone otro fondo, otro vidrio, otra paleta o rediseñar el panel, no se aplica. Esas skills
  pueden usarse en el admin solo para lo que esta no cubre y sin contradecirla.
- Si una instrucción de `AGENTS.md` y esta skill parecen chocar dentro de `/admin`:
  fondo y superficies → esta skill; cualquier otra cosa → `AGENTS.md`.
- Orden de prioridad dentro de `/admin`: (1) esta skill para fondo y superficies → (2) `AGENTS.md`
  para todo lo demás → (3) cualquier otra skill de diseño, solo si no contradice a las dos anteriores.
- No crear otros archivos de diseño para el admin (`DESIGN.md` en la raíz, otro `.md`, otra skill).
  Cualquier ajuste del tema se hace aquí y en `references/tema-admin.css`, y se copia a
  `app/admin/tema-admin.css` (deben quedar idénticos).

## 4. El diseño (valores exactos)

### 4.1 Fondo
- Color base del envoltorio: `#9FB2A6` (visible un instante antes de pintar el lienzo).
- Planta: `<canvas>` pintado por `FondoFollaje` a media resolución, con:
  - base vertical `#A5B7AC → #93A99A`;
  - 5 grupos de 34 hojas en `[x, y, escala]`: `[.30,.30,.9]`, `[.72,.22,.7]`, `[.55,.75,1.1]`, `[.12,.85,.8]`, `[.95,.70,.8]`;
  - verdes con peso: `#2F4F1A`×2, `#3F6418`×3, `#5E8A24`×4, `#86B33A`×5, `#A9CF55`×4, `#C9E58A`×3, `#DCEBB8`×1;
  - 10 destellos en modo `screen` (`rgba(235,244,215,.45)` → transparente, radio 40–130 px);
  - semilla fija `7` (el fondo es igual en cada visita).
- Tratamiento: `.adm-fondo` fijo, `inset: -80px`, `filter: blur(40px) saturate(0.9) brightness(1.04)`.
- Velo encima (`.adm-velo`): `rgba(236,241,232,.20)` + viñeta radial `rgba(160,178,166,.30)` hacia los bordes.
- Ambos `aria-hidden`, `pointer-events: none`, `z-index: -1` dentro del envoltorio con `isolation: isolate`.

### 4.2 Vidrio
| Token | Valor | Uso |
|---|---|---|
| `--adm-vidrio` | `rgba(250,252,246,.40)` | tarjetas, filtros, menú, mensajes de carga y error |
| `--adm-vidrio-fuerte` | `rgba(250,252,246,.58)` | tablas densas, formularios largos, paneles laterales (clase `adm-vidrio-fuerte`) |
| `--adm-vidrio-opaco` | `rgba(250,252,246,.94)` | respaldo sin `backdrop-filter` o con transparencia reducida |
| `--adm-resalte` | `rgba(253,249,240,.62)` | elemento destacado dentro del vidrio: avisos sin leer de `Notifications` (en vez de su `bg-crema` opaco) |
| `--adm-brillo` | `linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.06))` | capa sobre el vidrio |
| `--adm-borde` | `rgba(255,255,255,.55)` | color del borde existente (no se agregan bordes nuevos) |
| `--adm-sombra` | `inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(255,255,255,.2), 0 10px 30px rgba(19,53,53,.10)` | relieve del vidrio |
| `--adm-sombra-hover` | `inset 0 1px 0 rgba(255,255,255,.9), 0 22px 40px -24px rgba(19,53,53,.40)` | tarjetas con `card-surface-hover` |
| `--adm-desenfoque` | `blur(28px) saturate(140%)` | `backdrop-filter` |

Encabezado del sitio dentro del admin: `rgba(250,252,246,.55)` con el mismo desenfoque; franja
"Nombre · Rol" bajo el encabezado: `rgba(250,252,246,.32)`. Bordes inferiores en `--adm-borde`.

Radios: no cambian (cada elemento conserva su `rounded-*`; `Card` sigue en 22 px).

### 4.3 Contraste (obligatorio)
Sobre vidrio, `text-gray-500` y `text-gray-600` no alcanzan AA. Dentro de `.tema-admin` se oscurecen
un tono: `text-gray-500 → #4b5563`, `text-gray-600 → #374151`. Es el único ajuste de texto permitido.
Antes de agregar en el admin un elemento con `text-gray-500/600` **y** una variante `hover:`/`focus:`
de color de texto, comprobar que se vea bien (la regla del tema ganaría también en hover).

### 4.4 Respaldo y accesibilidad (ya en la hoja)
- Sin soporte de `backdrop-filter` o con `prefers-reduced-transparency: reduce` → `--adm-vidrio-opaco`.
- Impresión → fondo blanco, sin planta, sin sombras ni desenfoque.
- El fondo es estático (sin animación), así que `prefers-reduced-motion` no requiere nada extra.

## 5. Implementación — Fase 1 (fondo + vidrio)

Atajo: `git apply .claude/skills/diseno-panel-admin/references/fase-1.patch` hace exactamente estos pasos.
A mano:

**Archivos nuevos**
1. `app/admin/tema-admin.css` ← copia exacta de `references/tema-admin.css`.
2. `components/admin/FondoFollaje.tsx` ← copia exacta de `references/FondoFollaje.tsx`.

**`app/admin/layout.tsx`** — agregar dos imports y envolver lo que ya devuelve, sin cambiar nada de adentro:
```tsx
import { FondoFollaje } from '@/components/admin/FondoFollaje'
import './tema-admin.css'
// …
return <div className="tema-admin"><FondoFollaje /><AppShell profile={profile}>…(igual que hoy)…</AppShell></div>
```

**Añadir una clase (al inicio del `className`, sin quitar nada):**
| Archivo | Elemento | Clase que se añade |
|---|---|---|
| `components/admin/AdminNav.tsx` | `<nav aria-label="Administración">` | `adm-nav` |
| `app/admin/loading.tsx` | `<p role="status">` | `adm-vidrio` |
| `app/admin/error.tsx` | `<div>` contenedor | `adm-vidrio` |
| `app/admin/usuarios/page.tsx` | `<form>` de filtros | `adm-vidrio` |
| `app/admin/pedidos/page.tsx` | `<form>` de búsqueda | `adm-vidrio` |
| `app/admin/transacciones/page.tsx` | `<form>` de periodo | `adm-vidrio` |
| `components/admin/tablero/TableroVista.tsx` | constante `tarjeta` | `adm-vidrio` |
| `components/admin/tablero/TableroVista.tsx` | sección "Últimas transacciones" (tabla densa) | `adm-vidrio-fuerte` |

Todo lo que usa `Card` o `Metrica` (usuarios, vendedores, certificados, drones, tests, mensajes,
pedidos, `QueueEmpty`, notificaciones) toma el vidrio automáticamente vía `.card-surface`: no se edita.

**No se tocan en Fase 1:** chips de estado (`bg-crema`, `bg-red-50`, `bg-amber-50`, `bg-gray-100`,
`bg-arena-claro`), inputs (`inputClass`), botones, `ActionFeedback`, `SitePie`, el ítem activo del menú.

## 6. Fase 2 (opcional, solo con aprobación explícita del dueño)

El prototipo muestra además `/admin/usuarios` como tabla con panel lateral y el menú numerado
(01, 02…). Eso cambia estructura, no solo aspecto, así que **no forma parte de este diseño** hasta que
se apruebe aparte. Si se aprueba, condiciones:
- Mismos datos que hoy (`listAdminUsers`): nombre, tipo de cuenta, región, teléfono, registro, estado,
  última decisión. No agregar columnas que requieran nuevas consultas.
- `UserModeration` se reutiliza tal cual (mismas props: `id`, `suspended`, `version`, `requestId`),
  solo cambia dónde se muestra. El panel lateral se abre con un enlace `?gestionar=<id>` que conserva
  `q`, `rol`, `estado` y `pagina`; sin JavaScript nuevo de negocio.
- Mismo formulario GET de filtros y misma paginación de 12.
- Tabla dentro de un contenedor `adm-vidrio adm-vidrio-fuerte`, con `overflow-x-auto` en móvil.

## 7. Verificación (antes de dar el cambio por terminado)

1. `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm run test:db`: sin errores ni warnings nuevos.
2. `git diff --stat`: solo aparecen `app/admin/**`, `components/admin/**` (y esta skill/documentación).
   Si aparece cualquier otro archivo, revertirlo.
3. Con la cuenta admin, recorrer las 10 rutas de §1: todo se ve, nada se movió, los formularios
   envían igual (filtrar usuarios, suspender/reactivar con motivo, resolver disputa, aprobar certificado,
   marcar mensaje, exportar CSV de transacciones).
4. Navegar del admin a `/marketplace`, `/panel-productor` y `/` **sin recargar**: deben verse exactamente
   como antes (sin fondo verde ni vidrio).
5. Probar a 390 px y 1440 px: sin desplazamiento horizontal nuevo.
6. Vista de impresión de `/admin/pedidos/[id]`: fondo blanco, legible.
7. Comparar con `references/resultado-real-escritorio.png` y `resultado-real-movil.png`.

## 8. Cómo revertir

Quitar en `app/admin/layout.tsx` el `<div className="tema-admin">`, `<FondoFollaje />` y los dos imports.
Con eso el panel vuelve a verse exactamente como antes (las clases `adm-*` añadidas no hacen nada sin el
envoltorio). Opcional: borrar `app/admin/tema-admin.css`, `components/admin/FondoFollaje.tsx` y las clases `adm-*`.

## 9. Mantenimiento

- **Nueva página del admin:** usar `Card`/`Metrica` como siempre (toman el vidrio solos). Para un
  contenedor propio con `bg-white`, añadir `adm-vidrio` delante. Nada más.
- **Nuevo componente compartido mostrado en el admin:** no editarlo para el tema; si se ve mal sobre el
  vidrio, ajustar con un selector `.tema-admin …` en `tema-admin.css` y anotarlo en esta skill.
- **Cambiar el tono:** solo variables `--adm-*` y los parámetros de §4.1 (también en `FondoFollaje.tsx`).
  Mantener `references/` sincronizado con los archivos reales.
