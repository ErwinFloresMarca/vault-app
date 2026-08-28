# Spec: Módulo 06 — Items

## Objetivo
Gestión de items de colección: CRUD admin + galería de archivos + API pública + página pública SEO-friendly.

## Commands
- Dev: `pnpm dev`

## API
Públicas (sin auth):
- `GET /api/collections/:slug/items` — items de una colección.
- `GET /api/items/:slug` — detalle de item (galería, stock/disponibilidad).

Admin (requiere ADMIN):
- `POST /api/admin/items` (con `collectionId`, archivos, stock inicial)
- `PUT /api/admin/items/:id`
- `DELETE /api/admin/items/:id` (soft: estado ARCHIVED)

## Páginas
- `/collections/[collectionSlug]/[itemSlug]` — galería de imágenes, nombre, colección, descripción, tags,
  stock/disponibilidad, estado de colección y botón "Conseguido" (según auth).

## Reglas
- Slug único; archivos vía `ItemFile.position` (0 = imagen principal).
- El stock se gestiona mediante `InventoryMovement` (m08); crear un item con stock inicial genera un movimiento IN.
- Estado: DRAFT | AVAILABLE | SOLD_OUT | ARCHIVED.

## Boundaries
- **Always**: validar que el item pertenece a la colección del slug; sanitizar HTML de descripción si hubiera.
- **Never**: cambiar stock sin pasar por movimientos/transacción.

## Success Criteria
- Un admin puede crear/editar/archivar items con galería.
- La página pública de item es accesible y SEO-friendly.
- El botón "Conseguido" refleja el estado de colección del usuario logueado (o pide login).
