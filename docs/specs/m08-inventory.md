# Spec: Módulo 08 — Inventario

## Objetivo
Sistema de inventario basado en movimientos atómicos. `CollectionItem.stock` y `soldQuantity` se mantienen
consistentes usando transacciones de base de datos + `InventoryMovement`.

## Commands
- Dev: `pnpm dev`

## API (admin)
- `POST /api/admin/inventory` — registrar un movimiento
  `{ itemId, type: IN|OUT|ADJUSTMENT|SALE, quantity, reason? }`.
- `GET /api/admin/inventory` — listar movimientos (filtro por item, paginación).

## Reglas (Consistencia)
- Cada movimiento se crea dentro de una transacción Prisma que:
  1. Inserta `InventoryMovement`.
  2. Actualiza `CollectionItem.stock` según el tipo:
     - `IN` → stock + quantity
     - `OUT` → stock - quantity
     - `ADJUSTMENT` → stock = quantity (ajuste absoluto)
     - `SALE` → stock - quantity y `soldQuantity` + quantity
- Evita inconsistencias del tipo "stock dice 10 pero se vendieron 8". El stock nunca debe quedar negativo.
- Los `ADJUSTMENT` fijan el stock absoluto; los demás son relativos.
- Servicio `InventoryService` centraliza esta lógica (no en el endpoint).

## Boundaries
- **Always**: transacciones para cualquier cambio de stock; validar que `quantity >= 0` y stock resultante >= 0.
- **Never**: setear `stock`/`soldQuantity` directo por el ORM fuera de movimientos.

## Success Criteria
- Un admin puede registrar movimientos y el stock/soldQuantity se reflejan correctamente.
- Es imposible dejar el stock en negativo.
- El dashboard (m09) usa `soldQuantity` consistente con los movimientos.
