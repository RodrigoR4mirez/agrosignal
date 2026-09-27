# 🌾 AgroSignal

> **Cosechas peruanas, directo de quien las cultiva.**

AgroSignal es un marketplace agrícola para el Perú: los productores publican
sus lotes con fotos, precio y stock, y los compradores los encuentran, revisan
su Sello de Inocuidad y hacen su pedido sin intermediarios.

---

## 🚀 Demo en vivo

**[agrosignal.vercel.app](https://agrosignal.vercel.app)**

---

## ¿Qué hace?

- 🧺 **Catálogo de cosechas** con búsqueda y filtros por cultivo, región, precio, destino y verificación
- 👩‍🌾 **Panel de productor**: publicar lotes en tres pasos, editar, gestionar stock y ventas
- 🛒 **Panel de comprador**: pedidos con seguimiento (pendiente → confirmado → enviado → recibido → calificado)
- ✅ **Sello de Inocuidad** en tres niveles: certificado documental, inspección con dron y test de residuos
- 🛡️ **Administración**: usuarios, moderación de lotes, revisión de certificados y disputas de pedidos

AgroSignal registra los acuerdos de compra; no procesa pagos en línea.
La confirmación de cuentas y recuperación de contraseña por correo requieren
SMTP en Supabase; consulta [variables de entorno](docs/VARIABLES-DE-ENTORNO.md).

### Datos de ejemplo

El catálogo público incluye lotes de **ejemplo** (etiquetados en la UI y no
comprables) para mostrar cómo se ve una publicación. Se cargan con
`scripts/cargar-ejemplos.mjs` y se retiran con `scripts/limpiar-ejemplos.sql`.

---

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vercel

---

## Correrlo localmente

```bash
git clone https://github.com/RodrigoR4mirez/agrosignal.git
cd agrosignal
npm ci
cp .env.example .env.local
# Completa las variables de Supabase antes de iniciar.
npm run dev
```

Abre `http://localhost:3000` (redirige a `/marketplace`). La preparación del
esquema y los buckets se explica en [Despliegue](docs/DESPLIEGUE.md).

Verificación: `npm run build`, `npm run test:db` y `npm run lint`.
La documentación de los cinco módulos está en [docs/README.md](docs/README.md).

---

## 🤝 ¿Quieres unirte?

Buscamos colaboradores con interés en comercio agrícola, desarrollo web y UX.

1. Fork este repositorio
2. Crea una rama: `git checkout -b feature/tu-idea`
3. Haz tus cambios y abre un **Pull Request**

### Ideas abiertas
- [ ] Contacto directo por WhatsApp desde la ficha del lote
- [ ] Precios de referencia de mercados mayoristas
- [ ] Analítica de visitas por lote
- [ ] App móvil

---

## Contacto

¿Ideas o quieres colaborar? Abre un [Issue](https://github.com/RodrigoR4mirez/agrosignal/issues) en GitHub.

---

<p align="center">
  <sub>Hecho con 🌾 para el campo peruano</sub>
</p>
