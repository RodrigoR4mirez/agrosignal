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
