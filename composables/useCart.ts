import type { ItemColor } from '~/types'

/**
 * Carrito de compras (m21). Vive en el navegador (localStorage `vv-cart`);
 * los precios se muestran como referencia y el servidor los recalcula al
 * crear el pedido.
 */
export interface CartLine {
  itemId: string
  slug: string
  collectionSlug: string
  name: string
  collectionName: string
  price: number
  imageUrl: string | null
  quantity: number
  /** Color elegido (si el item tiene colores). Mismo item en otro color = otra línea. */
  color?: ItemColor | null
}

/** Clave única de una línea: item + color. */
export function cartLineKey(line: Pick<CartLine, 'itemId' | 'color'>): string {
  return `${line.itemId}::${line.color?.name.toLowerCase() ?? ''}`
}

const STORAGE_KEY = 'vv-cart'
export const CART_MAX_QTY = 50

export function useCart() {
  const lines = useState<CartLine[]>('cart:lines', () => [])
  const loaded = useState<boolean>('cart:loaded', () => false)

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.value))
    } catch {
      // almacenamiento no disponible (modo privado): el carrito vive en memoria
    }
  }

  // Cargar una sola vez en el cliente, después de hidratar (el SSR no conoce
  // el carrito; así se evitan diferencias de hidratación).
  if (import.meta.client && !loaded.value) {
    loaded.value = true
    onNuxtReady(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed)) {
          lines.value = parsed.filter((l) => l && typeof l.itemId === 'string' && Number.isInteger(l.quantity) && l.quantity > 0)
        }
      } catch {
        lines.value = []
      }
    })
  }

  const count = computed(() => lines.value.reduce((acc, l) => acc + l.quantity, 0))
  const subtotal = computed(() => Math.round(lines.value.reduce((acc, l) => acc + l.price * l.quantity, 0) * 100) / 100)

  function add(line: Omit<CartLine, 'quantity'>, quantity = 1) {
    const key = cartLineKey(line)
    const existing = lines.value.find((l) => cartLineKey(l) === key)
    if (existing) {
      existing.quantity = Math.min(CART_MAX_QTY, existing.quantity + quantity)
      Object.assign(existing, { ...line, quantity: existing.quantity })
    } else {
      lines.value.push({ ...line, quantity: Math.min(CART_MAX_QTY, quantity) })
    }
    persist()
  }

  /** `key` = cartLineKey(línea). */
  function setQuantity(key: string, quantity: number) {
    const line = lines.value.find((l) => cartLineKey(l) === key)
    if (!line) return
    if (quantity <= 0) return remove(key)
    line.quantity = Math.min(CART_MAX_QTY, Math.floor(quantity))
    persist()
  }

  /** `key` = cartLineKey(línea). */
  function remove(key: string) {
    lines.value = lines.value.filter((l) => cartLineKey(l) !== key)
    persist()
  }

  function clear() {
    lines.value = []
    persist()
  }

  function has(itemId: string) {
    return lines.value.some((l) => l.itemId === itemId)
  }

  return { lines, count, subtotal, add, setQuantity, remove, clear, has }
}

export const formatBs = (n: number) =>
  `Bs ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
