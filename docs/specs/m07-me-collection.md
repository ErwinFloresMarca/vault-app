# Spec: Módulo 07 — Colección personal

> **Spec as-built** (reconstruida desde la implementación).

## Objetivo
Permitir a un usuario autenticado marcar/desmarcar items como conseguidos y
consultar su colección. Base para gamificación futura.

## API (requieren `requireUser`)
- `POST /api/items/:id/collect` — marca como conseguido. **Idempotente** vía
  `upsert` sobre `@@unique([userId, itemId])`; fija `obtainedAt`. Responde
  `{ success: true, collected: true }`.
- `DELETE /api/items/:id/collect` — desmarca (`deleteMany`). Responde
  `{ success: true, collected: false }`.
- `GET /api/me/collection` — items conseguidos del usuario, orden `obtainedAt desc`,
  con la imagen principal (`position = 0`) y la colección. Responde
  `{ success, data[], total }`.

El parámetro es **`:id`** (id del item), no slug.

## Progreso
No existe endpoint `/api/me/collections/:slug/progress`. El progreso **por
colección** se calcula en `collectionService.computeProgress(collectionId, userId)`
y se incluye en `GET /api/collections/:slug` (`progress: { total, collected,
percent, collectedItemIds }`), solo cuando hay sesión.

- `GET /api/me/stats` (requireUser) — progreso **global**:
  `{ totalItems, collectedItems, percent, collections, completedCollections }`
  (solo colecciones `PUBLISHED` y sus items no archivados). Se muestra como anillo
  (`components/atoms/ProgressRing.vue`) en `/me`; el detalle de colección usa el
  mismo componente con el `progress` de la colección.

## UI
- `composables/useCollectItem.ts` — `toggle(itemId, collected)`; si no hay sesión,
  redirige a `/login`.
- `pages/collections/[collectionSlug]/[itemSlug].vue` — botón Conseguir/Conseguido.
- `pages/collections/[slug].vue` — barra de progreso.
- `pages/me/index.vue` — grid de la colección personal.

## Reglas
- Las operaciones solo afectan al usuario de la sesión.
- La unicidad `(userId, itemId)` garantiza colección sin duplicados.

## Success Criteria (verificado)
- Un usuario marca/desmarca items y ve su lista en `/me`.
- La página de colección muestra progreso en % y `collected` por item.
- No se pueden crear duplicados.
