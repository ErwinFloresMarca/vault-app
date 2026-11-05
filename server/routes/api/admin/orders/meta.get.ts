import { orderService } from '~/server/services/orderService'
import { requireAdmin } from '~/server/utils/auth'

/** Datos auxiliares del panel de pedidos (lista de admins para "Imprimió"). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { success: true, data: { admins: await orderService.listAdmins() } }
})
