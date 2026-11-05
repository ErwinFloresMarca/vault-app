import { orderService } from '~/server/services/orderService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id' })

  switch (event.method) {
    case 'GET': {
      await requireAdmin(event)
      return { success: true, data: await orderService.get(id) }
    }
    case 'PUT': {
      await requireAdmin(event)
      const body = await readBody(event)
      return { success: true, data: await orderService.update(id, body ?? {}) }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
