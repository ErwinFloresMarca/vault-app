import { orderService } from '~/server/services/orderService'
import { requireAdmin } from '~/server/utils/auth'

/** Reenvía al cliente el correo de la fase actual ("Pedido realizado" o "Pedido confirmado"). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id' })
  const sent = await orderService.resendCustomerEmail(id)
  if (!sent) throw createError({ statusCode: 502, statusMessage: 'No se pudo enviar el correo (revisa la configuración SMTP)' })
  return { success: true }
})
