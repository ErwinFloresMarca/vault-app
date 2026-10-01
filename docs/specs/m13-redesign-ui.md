# Spec: Módulo 13 — Rediseño UI Cyber-Luxe (Stitch)

> **Spec de rediseño.** Fuente de diseño: `docs/stitch_volt_vault_ui_ux_platform/`
> y el `DESIGN.md` reescrito. Objetivo: llevar toda la UI al sistema oscuro
> **Cyber-Luxe** de los diseños, de forma responsiva y consistente.

## Objetivo

Reemplazar el tema claro "industrial" actual (Inter, acento Volt Blue, pills
mayúsculas) por el sistema **Cyber-Luxe**: base navy profunda, acentos dorado/azul/
púrpura, tipografía **Plus Jakarta Sans + Hanken Grotesk**, superficies de cristal,
glows y rarezas. Mantener toda la funcionalidad existente y añadir los patrones
visuales de los diseños (anillos, tarjetas de bóveda, checklist, telemetría).

## Supuestos (validar)

1. **Claro y oscuro**; **oscuro por defecto** (los diseños son oscuros; el claro se deriva).
2. Se conservan las entidades actuales; los elementos nuevos de los diseños que
   requieren **datos inexistentes** se implementan en la Fase 5 (**aprobada**).
3. Se usa **@nuxt/ui** como base de componentes, re-tematizado con `app.config.ts`.
4. Fuentes vía `@nuxt/fonts` (Plus Jakarta Sans, Hanken Grotesk).
5. El copy de producto/coleccionable es el actual (los diseños traen copy de ejemplo).

## Mapeo pantallas Stitch → páginas del proyecto

| Stitch | Página | Datos que ya existen |
|---|---|---|
| Inicio (desktop/móvil) | `/` | colecciones destacadas, portadas, progreso |
| Colecciones (desktop/móvil) | `/collections` | lista, etiquetas, filtros, orden, paginación, progreso |
| Detalle de producto (desktop/móvil) | `/collections/[collectionSlug]/[itemSlug]` | galería, estado, **rareza**, stock, descripción, Conseguir, wishlist, "N lo tienen"/"N lo quieren" |
| Checklist y progreso | `/collections/[slug]` | progreso (X/Y, %), items, colección completada |
| Insignia/logo | marca | favicon/logo Volt Vault |
| Panel admin dashboard | `/admin/dashboard` | conteos, ventas, top 5, actividad reciente |
| Admin items + formulario | `/admin/items` | CRUD, estado, rareza, stock |
| Admin nueva colección | `/admin/collections` | CRUD, estado, portada, etiquetas |
| Admin inventario + lote | `/admin/inventory` | movimientos, batches, stock, clientes |

## Diferencias clave vs. la UI actual

- **Tema**: claro → **oscuro** (navy + glow).
- **Acento**: Volt Blue → **dorado** como CTA primaria, azul para interacción, púrpura épico.
- **Tipografía**: Inter/peso 400 → **Plus Jakarta Sans** (display) + **Hanken Grotesk** (cuerpo), con negritas.
- **Formas**: pills + hairlines → pills + **tarjetas `rounded-xl` con borde de rareza** y glows.
- **Nuevos patrones**: fila de **stats**, sección **sistema de rarezas**, **bóveda personal**,
  **checklist** de colección, **ficha técnica**, **tarjeta de recompensa**, **telemetría** (admin).

## Fases (cada una: spec → implementación → verificación → commit + Linear)

### Fase 1 — Tokens, tema y fuentes
- `assets/css/main.css` (`@theme static`): colores base/superficies/bordes, dorado/
  azul/púrpura, rarezas, success/warning/error, tipografía (familias y escala), radios,
  sombras/glows; base dark (body `#041428`, texto `#F8FAFC`).
- `app.config.ts`: `ui.colors.primary='gold'`, `secondary='volt'`, `neutral='navy'`;
  slots de button/badge/input/card/table según `DESIGN.md`.
- `@nuxt/fonts`: cargar Plus Jakarta Sans + Hanken Grotesk.
- **Aceptación**: tokens resueltos en el navegador; app en oscuro; botones dorados.
- **Verificación**: Playwright (colores/fuentes computados), eslint, typecheck.

### Fase 2 — Componentes base
- Botones (primaria gold, secundaria volt, ghost), chips/badges de **rareza** (con LED),
  **Vault Card** (producto y colección, con borde de tier), **anillo** y **barra** de
  progreso, inputs/selects, **segmented**, sidebar admin, tablas, modales, toasts,
  skeletons/empty.
- **Aceptación**: componentes coinciden con `DESIGN.md`; usados en al menos una pantalla.

### Fase 3 — Páginas públicas
- **Inicio**: hero con showcase + CTAs, fila de stats, "Colecciones destacadas",
  sección "Sistema de rarezas", CTA de bóveda personal.
- **Colecciones**: headers + filtros (pills/buscador/orden) + grid de Vault Cards con
  progreso + paginación + barra "bóveda personal enlazada".
- **Detalle de colección**: cabecera de bóveda (stats: total, en tu bóveda, rarezas,
  coleccionistas), progreso, **modo checklist**, grid con estados, tarjeta de recompensa.
- **Detalle de producto**: galería + **ficha técnica**, disponibilidad, CTA
  Conseguir/wishlist, contadores, "otros coleccionables de la serie", progreso global,
  CTA sticky móvil.

### Fase 4 — Admin
- **Dashboard**: sidebar, métricas en tarjetas, top 5, actividad reciente, barra de estado.
- **Colecciones / Items / Inventario**: tablas y formularios re-tematizados, modales y
  batch con el nuevo sistema.

### Fase 5 — Extras que requieren datos nuevos (APROBADA)
- **Ficha técnica** del producto: `ItemSpec` (escala/altura, material/acabado,
  iluminación, base/soporte, manifiesto). Migración + admin + display.
- **XP / niveles / insignias / logros**: modelo de gamificación (`Achievement`,
  `UserAchievement`, XP por acción). Es el mayor alcance nuevo.
- **Certificados/autenticidad** y **telemetría** (admin): decorativos o derivados.
- **Contadores**: "coleccionistas activos", "rarezas" (derivables de datos actuales).

## Boundaries

- **Always**: tokens en `main.css`/`DESIGN.md`; accesibilidad AA; `prefers-reduced-motion`;
  componentes reutilizables; el producto como protagonista.
- **Ask first**: migraciones de schema (Fase 5); añadir dependencias; modo claro.
- **Never**: hardcodear hex fuera de tokens; introducir datos falsos en producción
  (los números decorativos de los diseños no se inventan); romper rutas/auth.

## Success Criteria

- Toda la app (público + admin) usa el sistema Cyber-Luxe, **responsivo** (móvil/tablet/desktop).
- Botones dorados primarios, chips de rareza y anillos/barras consistentes con `DESIGN.md`.
- Detalle de producto y colección muestran galería/anillo/checklist y acciones completas.
- Contraste AA y `prefers-reduced-motion` verificados.
- `eslint`, `typecheck` y `build` en verde; verificación con Playwright por pantalla.

## Open Questions

1. ~~¿Dark-only o claro?~~ **Resuelto: claro + oscuro (oscuro por defecto).**
2. ~~¿Se aprueba la Fase 5?~~ **Resuelto: aprobada (incluye migraciones de schema).**
3. ¿La **telemetría** del admin es real (derivada) o solo visual?
4. ¿Se traducen/conservan los textos de ejemplo de los diseños (nombres de producto)?
5. ¿Prioridad: público primero (Fases 1-3) y luego admin (4), o al revés?

## Estado

- **Fase 1 (tokens, tema y fuentes): ☑** `SEL-107`. `assets/css/main.css` (`@theme static` +
  semántica claro/oscuro), `app.config.ts` (primary gold, secondary volt, neutral slate,
  formas), `@nuxt/fonts` (Plus Jakarta Sans + Hanken Grotesk), oscuro por defecto.
- **Fase 2 (componentes base): ☑** `SEL-108`. `VaultCard` (borde/glow de rareza), `ProgressRing`
  (dorado/azul), `RarityBadge` (chip con LED), `StatusBadge` (chip), `StockIndicator`; tarjetas
  `CollectionCard`/`ItemCard` refactorizadas a Vault Cards.
- **Fase 3 (páginas públicas): ☑** `SEL-109`. Inicio (hero + fila de métricas reales vía
  `GET /api/stats` + colecciones destacadas + sistema de rarezas + CTA de bóveda), Colecciones
  (cabecera + consola de filtros con buscador/pills/orden + grid + paginación + banner de bóveda),
  detalle de colección (cabecera de bóveda + stats + rarezas + **modo checklist** + tarjeta de
  recompensa) y detalle de producto (galería + disponibilidad + prueba social + CTAs + ficha
  técnica + relacionados + CTA sticky móvil). Copy sin referencias a fabricación; login
  re-tematizado. Nuevos: `StatTile`, `SectionHeading`, `CollectionChecklist`.
- **Fase 4 (admin): ☑** `SEL-110`. Sidebar con marca y "Cerrar sesión"; Dashboard general con KPIs
  (conteos y ventas reales), top 5 con rareza/stock y feed de actividad; Colecciones/Items con
  miniaturas, `StatusBadge`/`RarityBadge` y acciones ghost; Inventario con movimientos tokenizados
  (`MovementBadge`) y batch re-tematizados.
- **Fase 5 (datos nuevos): ◐** `SEL-111`. Ficha técnica → `m14-ficha-tecnica.md` (☑ `SEL-121`);
  gamificación (XP/niveles/insignias) → `m15-gamificacion.md` (◐ `SEL-122`).
