# Spec: Módulo 11 — Volt Arcade (paleta + gamificación)

> **Spec nueva.** Fuente de diseño: `DESIGN.md` (sección “Volt Arcade”).
> Objetivo: hacer la experiencia más atractiva, interactiva y “coleccionable”.

## Objetivo
Subir el atractivo para coleccionistas sin romper las reglas vigentes de
`DESIGN.md` (pill, uppercase, peso único 400, un solo acento interactivo):
paleta con más energía (Volt Arcade), gamificación y catálogo/detalle más ricos.

## Fases y tareas
1. **Tokens Volt Arcade** — navy + rarezas + acento amarillo en `main.css`
   (`@theme static`) y `DESIGN.md`. Bajo riesgo.
2. **Gamificación v1** — rareza por item (schema), anillo de progreso por
   colección y global, logro “colección completada”, animación al “Conseguir”,
   wishlist y contador social.
3. **Catálogo** — hero con producto real, cards de colección con portada
   (fallback degradado+iniciales), nº items y progreso; grid más denso, filtros
   sticky + contador de resultados + orden.
4. **Detalle de item** — galería con thumbnails/lightbox y CTA sticky en móvil.

## Schema (fase 2)
- `CollectionItem.rarity` — enum `Rarity { COMMON | RARE | EPIC | LEGENDARY }`,
  default `COMMON`. Requiere migración Prisma.
- Logros v1: calculados (sin tabla). Tabla `Achievement` solo si hacen falta.

## API (fases 2–4)
- `GET /api/collections/:slug` ya devuelve `progress` (se reutiliza para el anillo).
- Nuevo `GET /api/me/stats` — progreso global del usuario (colecciones completadas,
  total conseguidos, racha). Requiere `requireUser`.
- `GET /api/items/:slug` expone `rarity`.

## Tokens (fase 1)
- Navy: `navy-900 #0A1A2F`, `navy-800 #0E2340`.
- Rarezas: `common #64748B`, `rare #1E90FF`, `epic #A855F7`, `legendary #FFD700`.
- Acento: `volt-yellow #FFD700` (ya existe). Primary: paleta `volt` (ya existe).

## Reglas
- Contraste **AA** en texto y badges; no usar amarillo como texto sobre blanco.
- Respetar `prefers-reduced-motion`: animaciones opcionales.
- La rareza no bloquea el “Conseguir”; es informativa.

## Boundaries
- **Always**: tokens en `main.css`/`DESIGN.md` como única fuente; componentes pill/uppercase/400.
- **Never**: hardcodear hex en componentes; romper el estado de auth/roles.

## Success Criteria
- Fase 1: tokens navy/rareza en `main.css` y documentados en `DESIGN.md`.
- Fase 2: cada item muestra rareza; detalle con anillo de progreso y animación al conseguir; `/api/me/stats`.
- Fase 3: catálogo con hero de producto, cards con fallback y grid denso con filtros sticky.
- Fase 4: galería con thumbnails/lightbox y CTA sticky en móvil.

## Estado
- Fase 1 (tokens): ☑ `SEL-45`.
- Fase 2 (gamificación): rareza ☑ `SEL-49`; anillo de progreso + stats ☑ `SEL-50`;
  animación al conseguir + logro ☑ `SEL-51`; wishlist + contador social ☑ `SEL-52`.
- Fase 3 (catálogo): ☑ `SEL-47` (hero con collage, cards con fallback/progreso,
  grid denso, filtros sticky + contador + orden).
- Fase 4 (detalle): ☑ `SEL-48` (galería con thumbnails/lightbox + CTA sticky móvil).
  **Volt Arcade completo (fases 1-4).**
