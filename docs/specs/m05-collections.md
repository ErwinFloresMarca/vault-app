# Spec: Módulo 05 — Colecciones

## Objetivo
Gestión de colecciones: CRUD admin + API pública + páginas públicas. Una colección tiene slug único, descripción
Markdown, tags, archivos (portada + galería) y muchos items.

## Commands
- Dev: `pnpm dev`

## API
Públicas (sin auth):
- `GET /api/collections` — listar (estado PUBLISHED), filtrable por tag, búsqueda, paginación.
- `GET /api/collections/:slug` — detalle (público si PUBLISHED).

Admin (requiere ADMIN):
- `POST /api/admin/collections`
- `PUT /api/admin/collections/:id`
- `DELETE /api/admin/collections/:id` (soft: estado ARCHIVED)

## Páginas
- `/collections` — listado de todas las colecciones.
- `/collections/[slug]` — portada, nombre, descripción Markdown (sanitizada), tags, items, y progreso del usuario
  autenticado (X/Y conseguidos, %).

## Reglas
- La descripción Markdown debe renderizarse y sanitarizarse (evitar XSS).
- El slug se genera desde `name` (lowercase, kebab-case) y se valida su unicidad.
- Endpoints delgados: route → validación → service → repository → ORM.

## Boundaries
- **Always**: sanitizar Markdown; validar inputs en backend.
- **Never**: exponer CRUD admin sin rol ADMIN.

## Success Criteria
- Un admin puede crear/editar/archivar colecciones (con tags y archivos).
- El catálogo público lista y muestra colecciones PUBLISHED con su contenido Markdown seguro.
- `/collections/[slug]` muestra el progreso del usuario autenticado.
