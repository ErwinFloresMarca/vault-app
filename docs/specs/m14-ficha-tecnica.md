# Spec: Módulo 14 — Ficha técnica del producto (ItemSpec)

> Parte de la Fase 5 de `m13-redesign-ui.md` (`SEL-111`). Añade datos estructurados
> de "ficha técnica" a cada coleccionable y reemplaza el bloque provisional del
> detalle de producto.

## Objetivo

Que cada `CollectionItem` pueda tener una **ficha técnica** (escala/altura,
material/acabado, iluminación, base/soporte) editable desde el admin y visible en
el detalle de producto, con el estilo Cyber-Luxe.

## Supuestos

1. La ficha es **opcional** por item; 1:1 con `CollectionItem`.
2. El "manifiesto" sigue siendo la descripción (Markdown) ya existente.
3. Sin precios ni stock en la ficha (eso ya vive en inventario).

## Requisitos (RFC-2119)

- El sistema **MUST** permitir guardar hasta 4 campos de ficha por item: `scale`,
  `material`, `lighting`, `base` (todos opcionales).
- El admin (crear/editar item) **MUST** permitir capturar estos campos.
- El detalle de producto **MUST** mostrar la ficha cuando exista al menos un campo;
  si no hay ficha, **MUST** mantener el bloque de datos reales actual (colección,
  rareza, estado, unidades).
- La API pública de item **MUST** incluir `spec` en `ItemDetail`.
- Los campos **MUST NOT** mostrarse vacíos (si un campo no tiene valor, no se pinta).

## Modelo

- `ItemSpec` (1:1 con `CollectionItem`, `onDelete: Cascade`):
  `scale`, `material`, `lighting`, `base` (`String?`) y `colors` (`Json`, default `[]`).
- `ItemDetail.spec?: ItemSpecDto | null`.

### Colores disponibles

- `colors`: lista `[{ name, hex }]` de colores en que se puede imprimir la pieza.
- El admin ofrece 20 colores comunes de filamento (`utils/filamentColors.ts`) y un color
  personalizado (nombre + selector de color). Vacío = no se muestra nada.
- `normalizeColors` (compartido) limpia la lista: hex `#RRGGBB`, nombre ≤ 40, sin repetidos
  por nombre, máx. 40 colores. Si se marcan colores, la ficha se guarda aunque no tenga textos.
- La ficha del producto muestra los colores como muestras con su nombre.

## Criterios de aceptación

- Tras `pnpm db:migrate`, la tabla `ItemSpec` existe y `pnpm db:generate` funciona.
- Editar un item en `/admin/items` y guardar la ficha persiste los valores.
- `/collections/[collectionSlug]/[itemSlug]` muestra la ficha con los valores.
- `eslint`, `typecheck` y Playwright en verde; sin errores de consola.

## Boundaries

- **Always**: la ficha es opcional; cascada al borrar el item.
- **Never**: hardcodear valores por defecto inventados en la ficha.

## Estado

- **☑ Implementado** `SEL-121`. Migración `20261001030527_add_item_spec`; modelo `ItemSpec`
  (1:1, cascade); `itemService` normaliza y hace upsert/delete de la ficha; admin con sección
  "Ficha técnica (opcional)"; detalle de producto muestra la ficha (con fallback a datos reales).
  Verificado con API + Playwright; eslint/typecheck en verde.
- **☑ Colores disponibles** — migración `20261107120000_add_item_spec_colors`.
