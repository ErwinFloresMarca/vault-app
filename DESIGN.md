# DESIGN.md — Volt Vault (Cyber-Luxe)

> **Fuente de verdad visual.** Basado en los diseños de Stitch en
> `docs/stitch_volt_vault_ui_ux_platform/` (16 pantallas + su `DESIGN.md`).
> Plan de implementación: `docs/specs/m13-redesign-ui.md`.

## Principios

- **Cyber-Luxe / arcade premium**: navy profundo presurizado + acentos radiantes
  (dorado, azul eléctrico, púrpura). No OLED negro puro.
- **Dopamina y progreso**: medidores, anillos, rarezas y logros que premian sin cansar.
- **Precisión técnica**: información afilada, HUD; el **producto** es el protagonista.
- **Superficies de cristal y glow** en vez de sombras difusas.

## Tokens — Color

| Token | Valor | Uso |
|---|---|---|
| `--color-base` | `#041428` | Fondo raíz de la app |
| `--color-navy-900` | `#0A1A2F` | Canvas / groove de barras de progreso |
| `--color-surface-1` | `#0E2340` | Tarjetas/paneles (90% + `backdrop-blur 12px`) |
| `--color-surface-2` | `#132D50` | Modales, dropdowns, estados elevados |
| `--color-border` | `#1E3A5F` | Hairlines, seams, bordes de tarjeta |
| `--color-border-strong` | `#254B78` | Bordes de modales/flotantes |
| `--color-gold` | `#FFD700` | CTA primaria, legendario, XP, logros |
| `--color-blue` | `#1E90FF` | Interacción, raro, telemetría, foco |
| `--color-purple` | `#A855F7` | Épico, recompensas auxiliares |
| `--color-text` | `#F8FAFC` | Texto principal (blanco metálico) |
| `--color-text-nav` | `#D5E3FF` | Texto sobre navy (on-surface) |
| `--color-text-muted` | `#94A3B8` | Secundario/ayudas |
| `--color-success` | `#22C55E` | Disponible |
| `--color-warning` | `#F59E0B` | Últimas unidades |
| `--color-error` | `#FFB4AB` | Agotado/errores (`--color-error-container` `#93000A`) |

**Rarezas** (chip = 15% del color + borde 1px del color + LED 6px):
`--color-rarity-common` `#64748B` · `--color-rarity-rare` `#1E90FF` ·
`--color-rarity-epic` `#A855F7` · `--color-rarity-legendary` `#FFD700`.

## Tokens — Tipografía

- **Plus Jakarta Sans** (`--font-display`): titulares, badges, métricas, `label-caps`.
- **Hanken Grotesk** (`--font-sans`): cuerpo, microcopy, especificaciones.
- **Numéricos tabulares** (`font-variant-numeric: tabular-nums`) en progresos,
  contadores y métricas (evita saltos al animar).

| Rol | Fuente / peso | Tamaño | Line-height | Tracking |
|---|---|---|---|---|
| display | Jakarta 800 | 3.5rem (2.25rem móvil) | 4rem | -0.03em |
| headline-lg | Jakarta 700 | 2.25rem | 2.75rem | -0.02em |
| headline-md | Jakarta 600 | 1.5rem | 2rem | -0.01em |
| headline-sm | Jakarta 600 | 1.25rem | 1.75rem | — |
| body-lg / md / sm | Hanken 400 | 1.125 / 1 / 0.875rem | 1.75 / 1.5 / 1.25rem | — |
| label-caps | Jakarta 700 | 0.75rem | 1rem | 0.12em (UPPERCASE) |
| metric-display | Jakarta 800 | 1.75rem | 2rem | -0.02em |
| metric-counter | Hanken 600 | 1rem | 1.25rem | — |

## Tokens — Espaciado, Radios y Elevación

- **Grid**: 12 columnas desktop (máx **1440px**, margin 3rem), 8 tablet (2rem),
  4 móvil (1rem). Gutter 1.5rem / 1rem móvil.
- **Space**: `xs .25` · `sm .5` · `md 1` · `lg 1.5` · `xl 2.5` rem.
- **Radios**: `sm .5rem` · `DEFAULT 1rem` · `md 1.5rem` · `lg 2rem` · `xl 3rem` · `full 9999px`.
  Pills = CTA, badges, chips, filtros, avatares. `xl (3rem)` = tarjetas showcase,
  hubs, modales. `lg (2rem)` = inputs, segmented, raíles de progreso.
- **Elevación/Glow** (en vez de sombras difusas):
  - Tier 1: `#0E2340` @90% + `backdrop-blur 12px` + borde 1px `#1E3A5F`.
  - Tier 2 (modales): `#132D50` + borde `#254B78` + `0 20px 40px -15px rgba(2,6,18,.7)`.
  - Legendary bloom: `0 0 25px -4px rgba(255,215,0,.35)` + `inset 0 1px 1px rgba(255,255,255,.3)`.
  - Volt pulse: `0 0 20px -3px rgba(30,144,255,.3)`.
  - Epic radiance: `0 0 20px -3px rgba(168,85,247,.3)`.
  - Common: sin glow; hairline `#1E3A5F`.

## Componentes

- **Botón primaria (acción/recompensa)**: pill `full`, fondo **gold** `#FFD700`,
  texto `#0A1A2F` Jakarta bold; hover aura `0 0 24px rgba(255,215,0,.45)`.
- **Botón secundaria (Volt)**: pill, fondo `#0E2340`, borde 1.5px `#1E90FF`, texto azul;
  hover rellena 15% azul.
- **Ghost**: pill sin borde, texto `#64748B` → blanco en foco/hover.
- **Chips y badges de rareza**: pill `full`, `label-caps`; 15% de tinte del color +
  borde 1px del color + LED 6px (pulsa en activo).
- **Vault Card (tarjeta de producto/colección)**: base `#0E2340`, `rounded-xl` (3rem),
  borde 1px `#1E3A5F`; en Rara/Épica/Legendaria el borde toma el color del tier con
  degradado superior; en el interior: canvas del producto, título, tag de rareza y
  footer de telemetría separados por divider `#1E3A5F`.
- **Anillos y barras de progreso**: anillo SVG (track `#1E3A5F`, activo `#FFD700`/`#1E90FF`,
  `stroke-linecap: round`); barra pill con groove `#0A1A2F` y relleno iluminado con shimmer.
- **Inputs**: pill `rounded-lg` (2rem), fondo `#0A1A2F`, borde 1px `#1E3A5F`,
  placeholder `#64748B`; foco → borde `#1E90FF` + glow `0 0 12px rgba(30,144,255,.25)`.
- **Checkbox / Segmented**: squircle-pill; check → fondo `#FFD700` con check navy.
  Tabs = cápsula con indicador deslizante `#132D50` + borde 1px.
- **Sidebar admin**: panel `#0E2340`, marca, navegación (Dashboard/Colecciones/Items/
  Inventario), pie "Volver al sitio" / "Cerrar sesión".
- **Tablas**: filas sobre `#0E2340`, header `label-caps` muted, hairline `#1E3A5F`,
  chips de estado/rareza, acciones ghost.
- **Modales / toasts**: Tier 2, `rounded-xl`, borde `#254B78`.

## Layout y responsive

- **Móvil (<768)**: 4 col, margin/gutter 1rem; **bottom sheets** en vez de dropdowns;
  pills a ancho completo; CTA sticky inferior en detalle de producto.
- **Tablet (768–1024)**: 8 col, margin 2rem, gutter 1.5rem.
- **Desktop (>1024)**: 12 col, contenedor máx 1440 centrado.
- Densidad: paddings internos en múltiplos de 4px; separación entre tarjetas amplia.

## Temas (claro y oscuro)

**Oscuro por defecto** (los diseños Stitch son oscuros); el usuario puede cambiar a
claro con el botón de color mode. La semántica de `@nuxt/ui` (`--ui-*`) se mapea por modo.

| Token | Oscuro (base) | Claro |
|---|---|---|
| `--ui-bg` (canvas) | `#041428` | `#F8FAFC` |
| `--ui-bg-muted` (surface‑1) | `#0E2340` | `#FFFFFF` |
| `--ui-bg-elevated` (surface‑2) | `#132D50` | `#F1F5F9` |
| `--ui-border` | `#1E3A5F` | `#E2E8F0` |
| `--ui-border-accented` | `#254B78` | `#CBD5E1` |
| `--ui-text` | `#F8FAFC` | `#0F172A` |
| `--ui-text-muted` | `#94A3B8` | `#64748B` |
| **Primary (CTA)** | `#FFD700` (texto navy) | `#B45309` (texto blanco) |

- En **oscuro** el dorado se usa como CTA con texto navy (`--ui-text-inverted` oscuro).
- En **claro** el dorado puro no contrasta: el primary pasa a **ámbar oscuro `#B45309`**
  (AA con texto blanco). Los tokens de marca (`--color-gold`) siguen disponibles para
  detalles decorativos.
- Respeta `prefers-color-scheme` como fallback.

## Accesibilidad

- Contraste **AA** (>4.5:1) sobre navy; blancos `#F8FAFC`/`#E2E8F0`.
- Foco visible (borde/glow azul), etiquetas, errores anunciados, táctil ≥44px.
- `prefers-reduced-motion`: desactiva shimmer/glow/transiciones.

## Cableado (implementación)

1. **Tokens** en `assets/css/main.css` (`@theme static`): colores, tipografía, radios,
   sombras/glows y `--ui-*` semánticos.
2. **Tema @nuxt/ui** en `app.config.ts`: `primary: 'gold'`, `secondary: 'volt'`,
   `neutral` navy, y slots de componentes (button/badge/input/card…) según este doc.
3. **Fuentes** con `@nuxt/fonts` (Plus Jakarta Sans + Hanken Grotesk) vía `--font-display`/`--font-sans`.
4. **Iconos** `lucide` (`@nuxt/icon`).
5. **Tema**: oscuro por defecto + claro (`colorMode`), con la semántica de arriba.

## Mapa de pantallas (Stitch → proyecto)

| Stitch | Página del proyecto |
|---|---|
| `inicio_volt_vault` / `inicio_m_vil` | `/` |
| `colecciones_volt_vault` / `colecciones_m_vil` | `/collections` |
| `detalle_de_producto_volt_vault` / `_m_vil` | `/collections/[collectionSlug]/[itemSlug]` |
| `colecci_n_cyber_storm_protocol_checklist_y_progreso` | `/collections/[slug]` (progreso + checklist) |
| `colecci_n_checklist_m_vil` | `/collections/[slug]` (móvil) |
| `panel_admin_dashboard_volt_vault` | `/admin/dashboard` |
| `admin_gesti_n_de_items_y_formulario` | `/admin/items` |
| `admin_nueva_colecci_n_m_vil` | `/admin/collections` |
| `admin_inventario_y_registro_por_lote` | `/admin/inventory` |
| `volt_vault_insignia_logo` | marca (header/footer/favicon) |

## Estado

- **Fase 1 (tokens, tema y fuentes): ☑** — cableado en `assets/css/main.css` (`@theme static`
  + semántica claro/oscuro), `app.config.ts` (primary gold, secondary volt, neutral slate,
  formas) y `@nuxt/fonts` (Plus Jakarta Sans + Hanken Grotesk). Oscuro por defecto.
- Fases 2-5 en `docs/specs/m13-redesign-ui.md` (componentes, públicas, admin, datos nuevos).
