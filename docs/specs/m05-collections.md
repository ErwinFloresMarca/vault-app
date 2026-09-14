# Spec: Módulo 05 — Colecciones

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
CRUD de colecciones (admin) + API pública + páginas. Una colección tiene slug
único, descripción Markdown, tags y archivos (portada + galería), y muchos items.

## API pública
- `GET /api/collections` → `collectionService.listPublic()`. Solo `PUBLISHED`,
  orden `orderIndex asc, createdAt asc`. Devuelve `CollectionSummary[]`
  (`id, name, slug, description, status, coverImage, tags[], itemCount`).
  **No** implementa filtro por tag, búsqueda ni paginación.
- `GET /api/collections/:slug` → `getBySlug(slug, userId)`. Un visitante anónimo
  solo ve `PUBLISHED` (404 si no lo está). Devuelve `CollectionWithItems`:
  `files[]`, `items[]` (no `ARCHIVED`, orden `orderIndex`) y `progress`
  (solo si hay usuario).

## API admin (requiere ADMIN)
- `GET /api/admin/collections` — todas, con `_count.items` y `files`.
- `POST /api/admin/collections` — body `{ name*, description?, tags?: tagId[],
  fileIds?: string[], status? }`. `status` default `PUBLISHED`. `fileIds` →
  `CollectionFile` con `position = índice`. Responde 422 si falta `name`.
- `GET /api/admin/collections/:id` — detalle con tags, files e items.
- `PUT /api/admin/collections/:id` — actualiza `name` (regenera slug), descripción,
  tags y files; reemplazo de tags/files en `prisma.$transaction`.
- `DELETE /api/admin/collections/:id` — **soft delete**: `status = ARCHIVED`.

## Páginas
- `/collections` — listado público.
- `/collections/[slug]` — portada, nombre, tags, descripción Markdown, barra de
  progreso del usuario (`progress`: `total, collected, percent, collectedItemIds`)
  y grid de items.
- `/admin/collections` — CRUD (usa `ImageField` y `CollectionBatchModal`).

## Reglas
- Slug generado de `name` (NFD, lowercase, kebab) con sufijo `-2`, `-3`… si colisiona.
- No hay capa `repositories/`: `collectionService` usa `prisma` directo.
- Markdown se renderiza con `components/atoms/MarkdownContent.vue` (`<MDC>` de
  `@nuxt/content`). La sanitización de HTML crudo debe revisarse antes de aceptar
  contenido no confiable.
- El progreso se calcula en `collectionService.computeProgress` (no hay endpoint
  propio de progreso).

## Boundaries
- **Always**: validar inputs en el servicio; validar rol en admin.
- **Never**: exponer CRUD admin sin `requireAdmin`; cambiar `stock` desde aquí.

## Success Criteria (verificado)
- Un admin crea/edita/archiva colecciones con tags y archivos.
- El catálogo lista y muestra colecciones PUBLISHED con su Markdown.
- `/collections/[slug]` muestra el progreso del usuario autenticado.
