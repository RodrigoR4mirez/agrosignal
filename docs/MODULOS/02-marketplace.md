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
