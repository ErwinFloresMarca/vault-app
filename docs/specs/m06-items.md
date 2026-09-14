# Spec: Módulo 06 — Items

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
CRUD de items de colección (admin) + galería de archivos + API pública + página
pública. El stock se gestiona exclusivamente vía movimientos de inventario (m08).

## API pública
- `GET /api/collections/:slug/items` → `itemService.listByCollectionSlug`; items
  no `ARCHIVED`, orden `orderIndex`, con flag `collected` si hay sesión.
- `GET /api/items/:slug` → `itemService.getBySlug`. Un visitante anónimo solo ve
  items `AVAILABLE` o `SOLD_OUT` (404 en otro estado). Devuelve `ItemDetail`:
  `collection {id,name,slug}`, `files[]`, `tags[]` (hoy siempre vacío),
  `stock, soldQuantity, status, collected`.

## API admin (requiere ADMIN)
- `GET /api/admin/items?collectionId=` — lista (colección, `_count.collectedBy`,
  files).
- `POST /api/admin/items` — body `{ name*, collectionId*, description?,
  fileIds?: string[], stockInicial?: number, status? }`. `status` default
  `AVAILABLE`. Si `stockInicial > 0`, crea un `InventoryMovement` tipo `IN`
  (reason `stock inicial`) y fija `stock` **dentro de una transacción**.
  Responde 422 si falta `name`/`collectionId` o si la colección no existe.
- `GET /api/admin/items/:id` — detalle con collection, files, movements y
  collectedBy.
- `PUT /api/admin/items/:id` — `name` (regenera slug), `description`, `fileIds`
  (reemplazo en transacción) y `status`. **No** modifica stock.
- `DELETE /api/admin/items/:id` — **soft delete**: `status = ARCHIVED`.

## Página
`/collections/[collectionSlug]/[itemSlug]` — galería (`ItemGallery`), badge de
estado (`StatusBadge`), indicador de stock (`StockIndicator`), descripción
Markdown y botón "Conseguir"/"Conseguido" (`useCollectItem`) o login si es anónimo.

## Reglas
- Slug único con sufijo `-2`, `-3`… si colisiona.
- Los archivos se enlazan por `fileIds` con `position = índice` (0 = principal).
- El stock **nunca** se edita directo desde el CRUD de items.
- Los items no tienen tags en esta versión (`tags: []`).

## Boundaries
- **Always**: validar que la colección existe; gastar movimientos para stock.
- **Never**: cambiar `stock`/`soldQuantity` fuera de `inventoryService`.

## Success Criteria (verificado)
- Un admin crea/edita/archiva items con galería.
- Crear con `stockInicial` genera un movimiento `IN` y stock consistente.
- La página pública muestra galería, estado, stock y el botón de colección.
