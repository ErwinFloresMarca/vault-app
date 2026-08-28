# Spec: Módulo 09 — Dashboard admin

## Objetivo
Panel administrativo con resumen de métricas y tabla de ventas, además de los CRUD de colecciones/items/tags.

## Commands
- Dev: `pnpm dev`

## Rutas
- `/admin/dashboard` — métricas y tabla.
- `/admin/collections` — CRUD colecciones.
- `/admin/items` — CRUD items.

## API (admin)
- `GET /api/admin/dashboard/summary` — totales: colecciones, items, stock disponible, unidades vendidas,
  usuarios registrados.
- `GET /api/admin/sales` — tabla: Colección | Item | Vendidos | Stock | % vendido, con ordenar/filtrar/buscar/paginar.
- `GET /api/admin/sales/top` — items más vendidos y colecciones más vendidas.

## Reglas
- Guard `ADMIN` en rutas y endpoints.
- Métricas derivadas: % vendido = soldQuantity/(soldQuantity+stock). Paginación server-side en la tabla.
- UI bajo `components/organisms` (SalesSummary, SalesTable) y `components/templates` (AdminDashboard).

## Success Criteria
- Un admin ve el resumen y la tabla con ordenación, filtro, búsqueda y paginación.
- Se listan top items y top colecciones.
- Solo accesible con rol ADMIN.
