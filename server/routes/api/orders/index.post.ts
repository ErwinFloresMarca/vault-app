import { orderService } from '~/server/services/orderService'
import { getCurrentUser } from '~/server/utils/auth'
import { checkRateLimit } from '~/server/mcp/rateLimit'
import type { CreateOrderInput } from '~/types'

/**
 * Crea un pedido desde el carrito (público: no requiere cuenta).
 * Si hay sesión, el pedido se vincula al usuario. Rate limit por IP.
 */
export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const limit = checkRateLimit(`orders:${ip}`, 5, 10 * 60_000)
  if (!limit.ok) {
    throw createError({ statusCode: 429, statusMessage: 'Demasiados pedidos seguidos. Intenta de nuevo en unos minutos.' })
  }

  const body = await readBody<CreateOrderInput & { website?: string }>(event)
  // Campo trampa anti-bots: los humanos no lo ven ni lo llenan
  if (body?.website) {
    throw createError({ statusCode: 422, statusMessage: 'Solicitud inválida' })
  }

  const user = await getCurrentUser(event)
  const order = await orderService.create(body, user?.id ?? null)
  return {
    success: true,
    // Al cliente solo se le devuelve su código único (no el correlativo interno)
    data: { code: order.code, customerEmail: order.customerEmail, subtotal: order.subtotal, itemCount: order.itemCount, deliveryMethod: order.deliveryMethod },
  }
})
