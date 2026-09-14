# Spec: Módulo 08 — Inventario

> **Spec as-built** (reconstruida desde la implementación). Amplía el plan
> original: además de `InventoryMovement`, existe `InventoryBatch` con
> trazabilidad de personas (`registeredBy` / `customer`).

## Objetivo
Inventario basado en movimientos atómicos. `CollectionItem.stock` y
`soldQuantity` (denormalizados) se mantienen consistentes en la misma transacción
que crea el/los `InventoryMovement`. Cada movimiento pertenece a un
`InventoryBatch` (grupo), lo que da trazabilidad por persona.

## API (requiere ADMIN)
- `POST /api/admin/inventory` — movimiento individual. Body
  `{ itemId*, type*, quantity*, reason?, registeredBy?: {userId?,name?,email?},
  customer?: {userId?,name?,email?} }`. Internamente crea un `InventoryBatch`
  (con la colección del item) y un `InventoryMovement`.
- `GET /api/admin/inventory?itemId=&type=&page=&pageSize=` — movimientos
  paginados (default 20, máx 100), con item y personas.
- `POST /api/admin/inventory/batch` — lote. Body
  `{ type*, collectionId?, reason?, lines: [{ itemId, quantity }]*, registeredBy?,
  customer? }`. Un `InventoryBatch` + N `InventoryMovement`.
- `GET /api/admin/inventory/batch?collectionId=&page=&pageSize=` — lotes
  paginados con colección, personas y movimientos/items.
- `GET /api/admin/users?role=USER&search=` — apoyo para elegir cliente con cuenta.

## Reglas de cálculo (`applyType`)
- `IN`: `stock += qty`
- `OUT`: `stock -= qty`
- `ADJUSTMENT`: `stock = qty` (absoluto)
- `SALE`: `stock -= qty` y `soldQuantity += qty`

## Consistencia (transacción Prisma)
1. Valida `quantity`: entero `>= 0` (individual) o `> 0` por línea (batch).
2. Crea el `InventoryBatch` (con `collectionId`, `reason`, personas).
3. Crea el/los `InventoryMovement` (heredan `reason` y personas del batch).
4. Actualiza `stock` (y `soldQuantity` solo en `SALE`).
5. Si algún `stock` quedaría **negativo** → error 409 y toda la transacción revierte.

`collectionId` del batch es opcional; si no se indica y todos los items son de
una sola colección, se deriva automáticamente; si son de varias o ninguna, queda
`null` (global).

## Personas
- `registeredBy`: por defecto el usuario de la sesión (`userId/name/email`).
- `customer`: **obligatorio** (nombre o `userId`) para `OUT` y `SALE`.
- Se persisten en `InventoryBatch` e `InventoryMovement`:
  `registeredByUserId/Name/Email`, `customerUserId/Name/Email` (FK opcionales a `User`).

## UI
- `pages/admin/inventory.vue` — filtros (colección, búsqueda), alta de batch por
  grupo e historial paginado.
- `components/molecules/InventoryModal.vue` — movimiento individual.
- `components/molecules/CollectionBatchModal.vue` — batch desde `admin/collections`.

## Boundaries
- **Always**: cualquier cambio de stock dentro de una transacción de movimiento.
- **Never**: setear `stock`/`soldQuantity` directo por el ORM fuera de este módulo.

## Success Criteria (verificado)
- Registrar movimientos refleja `stock`/`soldQuantity` correctamente.
- Es imposible dejar el stock en negativo (409).
- `SALE` acumula `soldQuantity`; el dashboard (m09) lo consume.
