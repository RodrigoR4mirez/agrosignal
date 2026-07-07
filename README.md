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
- 📈 Cruza datos climáticos con **63 años de producción histórica**
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
