---
name: AgroSignal Design System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#40493f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#717a6f'
  outline-variant: '#c0c9bc'
  surface-tint: '#2a6b37'
  primary: '#004317'
  on-primary: '#ffffff'
  primary-container: '#1a5c2a'
  on-primary-container: '#8fd394'
  inverse-primary: '#93d697'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc641'
  on-secondary-container: '#715300'
  tertiary: '#662035'
  on-tertiary: '#ffffff'
  tertiary-container: '#83374b'
  on-tertiary-container: '#ffacbd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aef3b1'
  primary-fixed-dim: '#93d697'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#0c5221'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f6be39'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ffd9df'
  tertiary-fixed-dim: '#ffb1c1'
  on-tertiary-fixed: '#3e0117'
  on-tertiary-fixed-variant: '#772e42'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-bold:
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
  touch-target: 48px
---

## Brand & Style
The design system for this Peruvian agricultural marketplace is built on the pillars of **Trust, Data Integrity, and Accessibility**. It bridges the gap between traditional farming and modern financial technology. 

The aesthetic is **Corporate Modern with a Tactile edge**, focusing on clarity and ease of use in diverse environmental conditions (from bright sunlight in the fields to office environments). The interface prioritizes high-density data visualization while maintaining a clean, professional atmosphere through generous whitespace and a sophisticated "Glass-and-Paper" approach—layering clean white cards over subtle, light-grey backgrounds to ensure depth and hierarchy.

## Colors
The palette is rooted in the Peruvian agricultural landscape.
- **Primary (Deep Green):** Evokes stability and growth. Used for main actions, navigation, and brand elements.
- **Secondary (Gold):** Used sparingly for highlighting premium features, alerts, or specific CTA accents to denote value.
- **Risk Indicators:** Crucial for the data-driven nature of the platform. These follow a traffic-light system but are optimized for accessibility by ensuring they meet WCAG AA contrast ratios against white surfaces.
- **Backgrounds:** Use a very light cool-grey (#F8FAFC) to reduce eye strain and make the white cards pop.

## Typography
This design system utilizes **Plus Jakarta Sans** for all text roles. It offers a modern, geometric clarity that excels in data-heavy tables and KPI dashboards. 
- **Headlines:** Use Bold weights to establish a clear hierarchy.
- **Data Points:** Use Medium weights for numerical values to ensure they are the focal point of the cards.
- **Spanish Localization:** Ensure line heights are generous (1.5x for body text) to accommodate the slightly longer word lengths typical in Spanish (Peru) compared to English.

## Layout & Spacing
The layout follows a **Fluid Grid** system based on an 8px base unit. 
- **Mobile:** Uses a 4-column grid with 24px side margins. Essential for field use where one-handed operation is common.
- **Desktop:** Uses a 12-column grid. KPI cards should span 3 or 4 columns, while main data tables/charts span 8 to 12 columns.
- **Vertical Rhythm:** Maintain consistent 16px or 24px gaps between cards to preserve the "clean and airy" professional look.

## Elevation & Depth
Depth is signaled through **Soft Shadows** and **Tonal Layering**. 
- **Surface 0:** Background (#F8FAFC).
- **Surface 1 (Cards):** Pure White (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)).
- **Surface 2 (Hover/Active):** Slightly more pronounced shadow to indicate interactivity.
- **Backdrop Blurs:** Used sparingly on navigation bars (Glassmorphism) to maintain context of the scroll position without cluttering the view.

## Shapes
The shape language is **distinctly rounded** to soften the data-heavy nature of the app and feel more approachable/modern. 
- **Standard Cards:** 1rem (16px) corner radius.
- **Buttons & Inputs:** 0.5rem (8px) for a professional yet soft feel.
- **Risk Badges:** Fully rounded (Pill-shaped) to distinguish them from interactive buttons.

## Components
- **Data Cards:** Features a top-aligned label, a large central KPI value, and a bottom-aligned "Risk Badge." Badges must include an icon (e.g., triangle for high, circle for medium) + color + text (e.g., "Riesgo Alto").
- **Segmented Controls:** Used for switching between "Productor" (Farmer) and "Comprador" (Buyer) views. These should have a clear sliding animation and high-contrast active states.
- **Buttons:** Primary buttons use the Deep Green background. Mobile buttons must maintain a minimum height of 48px to accommodate "field usage" where precision might be lower.
- **Charts:** Line charts for climate data should use a 2px stroke width with subtle area gradients below the line. Use the Gold accent for "Current/Today" markers.
- **Input Fields:** Use "Outlined" style with a 1px border. When focused, the border thickens to 2px in Primary Green with a soft outer glow.