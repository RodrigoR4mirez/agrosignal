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
