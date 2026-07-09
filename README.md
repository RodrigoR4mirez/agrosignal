# 🌾 AgroSignal

> **Anticipa la cosecha, asegura tu negocio.**

AgroSignal es una plataforma de inteligencia agrícola para el Perú. Combina datos climáticos satelitales con histórico de producción para detectar riesgo de mala cosecha — antes de que ocurra. Diseñada para agricultores, compradores y cooperativas que necesitan datos reales para tomar mejores decisiones.

---

## 🚀 Demo en vivo

**[agrosignal.vercel.app](https://agrosignal.vercel.app)**

---

## ¿Qué hace?

- 🔴 Detecta cultivos en **riesgo de mala cosecha** para el año en curso
- 🌡️ Analiza **temperatura, lluvia y humedad** por región
- 📈 Serie histórica FAOSTAT 1961–2024 como referencia; el modelo de riesgo se entrena con la ventana **2015–2024** (datos anuales)
- 🗺️ Cubre las **25 regiones del Perú** y **30 cultivos** principales
- 🔄 Se actualiza automáticamente **cada mes**

---

## Cultivos monitoreados

Papa · Caña de azúcar · Arroz · Café · Cacao · Palta · Espárrago · Mango · Uva · Maíz · Plátano · Yuca · Mandarina · Cebolla · Piña · Limón · Arándano · Aceituna · Tomate · Trigo · Frijol · Haba · Camote · Alcachofa · Palma aceitera · Papaya · Naranja · **Jengibre** · **Ají/Rocoto**

---

## Fuentes de datos

| Fuente | Qué aporta |
|--------|-----------|
| NASA POWER | Clima diario por coordenadas (1981–hoy) |
| FAOSTAT | Producción histórica de cultivos (1961–2024) |
| MINAGRI Perú | Referencia de datos nacionales |

---

## 🤝 ¿Quieres unirte?

AgroSignal es un proyecto abierto. Buscamos colaboradores con interés en:

- 🌱 Agronomía o ciencias del agro
- 📊 Datos y modelos predictivos
- 💻 Desarrollo web y UX
- 🛒 Comercio agrícola y mercados locales

### Cómo contribuir

1. Fork este repositorio
2. Crea una rama: `git checkout -b feature/tu-idea`
3. Haz tus cambios y abre un **Pull Request**

### Ideas abiertas
- [ ] Mapa interactivo del Perú con riesgo por región
- [ ] Precios de mercado en tiempo real
- [ ] Portal de compra/venta entre agricultores y compradores
- [ ] Alertas por WhatsApp cuando sube el riesgo
- [ ] App móvil

---

## Correrlo localmente

```bash
git clone https://github.com/RodrigoR4mirez/agrosignal.git
cd agrosignal
npm install
npm run dev
```

Abre `http://localhost:3000`

---

## Contacto

¿Ideas o quieres colaborar? Abre un [Issue](https://github.com/RodrigoR4mirez/agrosignal/issues) en GitHub.

---

## 🗓️ Historial de versiones

### v1.3.0 — Corrección crítica de datos y auditoría _(julio 2026)_

**⚠️ Corrección de datos erróneos publicados.** Una auditoría contra las fuentes
originales detectó que dos cultivos usaban códigos de ítem FAOSTAT equivocados:

- **Papaya** usaba el código 526 (**Apricots/albaricoques**) → corregido a **600 (Papayas)**. La alerta de riesgo ALTO 68% que mostraba el dashboard estaba calculada sobre datos de albaricoques y fue retirada (N/D hasta regenerar con datos reales).
- **Aceituna** usaba el código 568 (**melones**) → corregido a **260 (Olives)**. La señal de riesgo BAJO publicada contradecía la caída real del olivo en 2024; fue retirada (N/D hasta regenerar).

Otros cambios:

- Validación automática de mapeo cultivo↔ítem en el pipeline: si un código FAOSTAT no corresponde al cultivo esperado, la actualización aborta en lugar de publicar datos incorrectos
- `actualizar.py` sincronizado de verdad: agrega Jengibre (720) y Ají/Rocoto (401), retira Quinua/Cebada que no están en el dashboard
- El riesgo del año en curso ahora se calcula con los **últimos 12 meses de clima** (ventana móvil normalizada a 365 días) en lugar del año calendario parcial, que sesgaba las predicciones
- Columna "Prod. media" unificada: una sola ventana (2015–2024) para los 30 cultivos (antes mezclaba medias de 10 y de 64 años en la misma tabla)
- `detector_riesgo.py`: año de predicción dinámico y regiones de Papaya/Jengibre/Ají agregadas (fixes que v1.2.0 declaraba pero no estaban en el repo)
- Descargo de responsabilidad visible en el dashboard
- Carpeta `svgs/` renombrada a `pipeline/` (contiene los scripts Python y datasets, no SVGs)

### v1.2.0 — Fixes y tabla completa _(julio 2026)_

- Dashboard muestra los **30 cultivos** en la tabla: 16 con predicción ML activa y 14 con badge N/D
- Corregidos 3 bugs en `detector_riesgo.py`: Papaya sin región asignada, año de clima hardcodeado en 2024, nombre de columna incorrecto
- `actualizar.py` sincronizado con todos los cambios del pipeline
- Banner actualizado a 30 cultivos; entorno virtual corregido en CLAUDE.md

### v1.1.0 — Expansión de cultivos _(julio 2026)_

- Investigación sistemática de 22 cultivos andinos y amazónicos adicionales contra FAOSTAT y MINAGRI
- **Agregados al pipeline completo (ML + riesgo):** Jengibre (Junín), Ají/Rocoto (Arequipa)
- **Sin datos públicos disponibles** — creado dataset climático NASA POWER por región representativa: Camu camu, Lúcuma, Sacha inchi, Aguaje, Cocona, Yacón, Tara, Achiote, Chirimoya, Mashua, Cañihua, Kiwicha, Granadilla, Maracuyá, Olluco, Cúrcuma
- Pendiente: búsqueda en fuentes regionales GORE Loreto, GORE Ucayali, DEVIDA
- Creado `data/perfiles_climaticos_andinos.csv` para monitoreo de anomalías climáticas en zonas productoras sin datos de producción

### v1.0.0 — Base del proyecto _(2025)_

- Pipeline de datos: NASA POWER (25 regiones, 10 años diarios) + FAOSTAT (28 cultivos, 1961–2024)
- Modelo Random Forest por cultivo para detectar riesgo de mala cosecha (umbral: producción 15% bajo la media histórica)
- Dashboard Next.js 16 con Recharts desplegado en Vercel
- Actualización mensual automática vía cron el día 1 de cada mes

---

<div align="center">
  <sub>Hecho con 🌾 para el campo peruano · NASA POWER · FAOSTAT · MINAGRI Perú</sub>
</div>
