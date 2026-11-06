import type { ItemStatus } from '~/types'

/**
 * Disponibilidad de venta de un item (m21 + estado «A pedido»).
 * Fuente única para la tienda (tarjetas, ficha, carrito) y para el servidor
 * (validación de pedidos), así lo que se ve es lo que se puede comprar.
 *
 * - `in_stock`    → Disponible y con stock > 0
 * - `on_demand`   → A pedido: se crea al confirmar el pago (no depende del stock)
 * - `sold_out`    → Agotado (estado SOLD_OUT, o Disponible sin stock)
 * - `unavailable` → Borrador / Archivado
 */
export type SaleState = 'in_stock' | 'on_demand' | 'sold_out' | 'unavailable'

export function saleState(status: ItemStatus | string, stock: number): SaleState {
  if (status === 'ON_DEMAND') return 'on_demand'
  if (status === 'AVAILABLE') return stock > 0 ? 'in_stock' : 'sold_out'
  if (status === 'SOLD_OUT') return 'sold_out'
  return 'unavailable'
}

/** Se puede pedir (si además tiene precio definido). */
export function isSellable(status: ItemStatus | string, stock: number): boolean {
  const state = saleState(status, stock)
  return state === 'in_stock' || state === 'on_demand'
}

/**
 * El precio se muestra en el catálogo solo si la pieza se puede pedir y el
 * precio está definido. Con precio indefinido (null) la ficha dice «Indefinido».
 */
export function showsPrice(status: ItemStatus | string, stock: number, price: number | string | null | undefined): boolean {
  return price != null && isSellable(status, stock)
}
