# Spec: Módulo 20 — Scroll, paginación y filtros en tablas admin

> Feature nueva de UX/admin. Corrige el scroll de la bandeja principal, añade
> paginación a las tablas de colecciones e items, filtros a items y un acceso
> directo desde una colección a sus items con el filtro ya aplicado.

## Objetivo

1. Que el contenido del panel admin tenga **scroll vertical** real (slot `#body`
   de `UDashboardPanel`), sin cortar tablas largas.
2. Que las tablas de `/admin/collections` y `/admin/items` tengan **paginación**
   server-side (el inventario ya la tiene).
3. Que `/admin/items` tenga **filtros**: búsqueda por nombre/slug, colección,
   estado y rareza, sincronizados con la query string.
4. Que `/admin/collections` tenga un botón **“Ver items”** que lleve a
   `/admin/items?collectionId=<id>` y deje el filtro de colección seleccionado.
5. Scroll horizontal en tablas anchas (móvil/tablet).

## Decisiones

- `UDashboardPanel` tiene un slot `#body` con `overflow-y-auto` y padding
  (`p-4 sm:p-6`). Las páginas admin pasan a usar `#header` + `#body`; el
  `UContainer` deja de llevar `p-6` para no duplicar padding.
- Paginación server-side solo cuando llega `page`; sin `page` los endpoints
  siguen devolviendo todo. Así no se rompen consumidores existentes
  (inventario, import, modal de batch).
- Filtros de items en el servidor (`q`, `collectionId`, `status`, `rarity`).
- La query string es la fuente de verdad de los filtros: recargar o compartir la
  URL mantiene búsqueda, colección, estado, rareza y página.
- No se añaden dependencias.

## API

### `GET /api/admin/items`

Query params:

| Param | Valores | Efecto |
| --- | --- | --- |
| `q` | texto | `name` o `slug` contains, case-insensitive |
| `collectionId` | id | filtra por colección |
| `status` | `DRAFT\|AVAILABLE\|ON_DEMAND\|SOLD_OUT\|ARCHIVED` | filtra estado |
| `rarity` | `COMMON\|RARE\|EPIC\|LEGENDARY` | filtra rareza |
| `page` | entero ≥ 1 | activa paginación |
| `pageSize` | 1..100 (default 20) | tamaño de página |

Respuesta:

```ts
{ success: true, data: Item[], total: number, page: number, pageSize: number }
```

- Sin `page`: devuelve todos los items que cumplan los filtros y
  `page = 1`, `pageSize = data.length`.
- Orden: `createdAt desc`.

### `GET /api/admin/collections`

Query params: `page`, `pageSize`.

- Sin `page`: todas las colecciones (compatibilidad).
- Con `page`: paginado `{ data, total, page, pageSize }`.
- Orden: `createdAt desc`.

## UI

### `/admin/items`

- Filtros: input de búsqueda (debounce 300 ms), select de colección (incluye
  “Todas”), select de estado, select de rareza y botón “Limpiar filtros”.
- Contador de resultados y rango (`Mostrando 1–20 de 57`).
- Paginación `UPagination` debajo de la tabla (`itemsPerPage = 20`).
- La tabla va en un wrapper `overflow-x-auto`.
- La página se inicializa desde `route.query`:
  - `collectionId` deja el select ya seleccionado.
  - `q`, `status`, `rarity`, `page` se respetan.
- Cambiar un filtro resetea a página 1 y actualiza la URL con
  `router.replace`.
- Si la página actual queda fuera de rango tras filtrar/borrar, se corrige.

### `/admin/collections`

- Paginación server-side (`itemsPerPage = 20`), contador y wrapper
  `overflow-x-auto`.
- Acción “Ver items de esta colección”:
  `/admin/items?collectionId=<id>`.
- Al crear/editar/borrar se refresca manteniendo la página; si queda vacía, se
  retrocede a la última página válida.

### Scroll global admin

- `pages/admin/{dashboard,collections,items,inventory,import}.vue` usan:
  ```vue
  <UDashboardPanel>
    <template #header><UDashboardNavbar ... /></template>
    <template #body><UContainer>...</UContainer></template>
  </UDashboardPanel>
  ```
- Los modales quedan dentro de `#body` (se teleportan igualmente).
- Tablas del dashboard/inventario también con `overflow-x-auto`.

## Requisitos (RFC-2119)

- El panel admin MUST tener scroll vertical en todas las páginas.
- Las tablas de items/colecciones MUST paginar sin cargar todo el catálogo.
- Los filtros de items MUST aplicarse en el servidor y reflejarse en la URL.
- El botón de colección MUST abrir items con `collectionId` seleccionado.
- Sin `page`, los endpoints MUST seguir devolviendo todos los registros.
- El modal de batch y la página de inventario MUST seguir recibiendo todos los
  items que necesitan (no paginados).

## Criterios de aceptación

- `/admin/items` muestra filtros, contador y paginación; cambiar filtros no
  recarga toda la página y actualiza la URL.
- `/admin/collections` pagina y “Ver items” abre items con la colección
  seleccionada.
- Recargar `/admin/items?collectionId=<id>&q=...` mantiene los filtros.
- El panel admin hace scroll vertical en dashboard, items, colecciones,
  inventario e importar.
- Inventario y el modal de batch siguen funcionando con todos sus items.
- `eslint`, `typecheck`, `build` y Playwright en verde.

## Archivos previstos

- `docs/specs/m20-admin-tablas-filtros.md`, `docs/specs/PLAN.md`.
- `server/routes/api/admin/items/index.ts`.
- `server/routes/api/admin/collections/index.ts`.
- `pages/admin/items.vue`, `pages/admin/collections.vue`.
- `pages/admin/dashboard.vue`, `pages/admin/inventory.vue`, `pages/admin/import.vue`.
- `components/molecules/CollectionBatchModal.vue` (quitar `pageSize=200`).

## Estado

- Fase 1 (API + paginación/filtros): ☑ `GET /api/admin/items` con `q`,
  `collectionId`, `status`, `rarity`, `page`, `pageSize`; `GET
  /api/admin/collections` con `page`/`pageSize`. Sin `page` devuelven todo.
- Fase 2 (items UI + query string): ☑ filtros con debounce, selects de
  colección/estado/rareza, limpiar filtros, contador/rango, `UPagination`,
  URL sincronizada y clamp de página fuera de rango.
- Fase 3 (colecciones + botón a items): ☑ paginación, contador, “Ver items”
  hacia `/admin/items?collectionId=<id>` con el select ya seleccionado.
- Fase 4 (scroll admin + verificación): ☑ páginas admin con `#header`/`#body`
  (scroll vertical), wrappers y `UPageCard` con `min-w-0` para scroll
  horizontal interno de `UTable`; Playwright en desktop y 600px.

## As-built

- `UDashboardPanel` default slot no scrollea; el `#body` sí
  (`flex-1 overflow-y-auto`). Se migraron dashboard, collections, items,
  inventory e import.
- El `UPageCard` necesita `:ui="{ container: 'min-w-0', body: 'min-w-0' }"`
  para que el `overflow-x-auto` de `UTable` no desborde la página en móvil.
- `CollectionBatchModal` dejó de pedir `pageSize=200`; sin `page` recibe todos
  los items de la colección.
- Inventario mantiene su paginación client-side/server-side existente y recibe
  todos los items porque no envía `page`.
- Los filtros se reflejan en la URL con `router.replace`; `page` solo se
  incluye si es > 1.

