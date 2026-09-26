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
