# Spec: Módulo 09 — Dashboard admin

> **Spec as-built** (reconstruida desde la implementación). El plan original
> preveía endpoints de ventas con tabla ordenable (`/api/admin/sales`,
> `/api/admin/sales/top`); la implementación real usa **un solo** endpoint de
> estadísticas y una UI más simple.

## Objetivo
Panel administrativo con métricas del catálogo y actividad reciente.

## API (requiere ADMIN)
- `GET /api/admin/dashboard/stats` — devuelve:
  - `counts`: `{ collections, items, users, collected }`
  - `sales`: `{ total (sum soldQuantity), avg (avg soldQuantity) }`
  - `top`: 5 items no `ARCHIVED` ordenados por `soldQuantity desc`
    (`id, name, slug, soldQuantity, stock, status, collection`)
  - `recent`: 6 `UserCollectedItem` más recientes (`obtainedAt, user, item`)

No existen `/api/admin/dashboard/summary`, `/api/admin/sales` ni
`/api/admin/sales/top`.

## Páginas (layout `admin`)
- `/admin/dashboard` — tarjetas de conteo, tabla "Más vendidos" y timeline de
  actividad reciente.
- `/admin/collections` — CRUD colecciones (+ `CollectionBatchModal`).
- `/admin/items` — CRUD items (+ `InventoryModal`, `ImageField`).
- `/admin/inventory` — inventario por batch (m08).

## Reglas
- `requireAdmin` en el endpoint; las páginas usan `layout: 'admin'` pero **no**
  tienen guard de middleware (ver m03: no cableado).
- Las métricas son derivadas: `total`/`avg` salen de `soldQuantity` (consistente
  con los movimientos de m08).
- Paginación server-side existe en inventario (m08), no en el dashboard.

## Boundaries
- **Always**: calcular métricas desde datos persistidos, no duplicar contadores.
- **Never**: exponer stats sin `requireAdmin`.

## Success Criteria (verificado)
- Un admin ve conteos, top de ventas y actividad reciente.
- Solo accesible vía API con rol ADMIN.
