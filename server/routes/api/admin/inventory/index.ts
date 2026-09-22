import { inventoryService } from '~/server/services/inventoryService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  switch (event.method) {
    case 'POST': {
      const body = await readBody(event)
      if (!body?.itemId || !body?.type || !('quantity' in body)) {
        throw createError({ statusCode: 422, statusMessage: 'Faltan campos obligatorios (itemId, type, quantity)' })
      }
      const item = await inventoryService.create(
        {
          itemId: body.itemId,
          type: body.type,
          quantity: body.quantity,
          reason: body.reason,
          registeredBy: body.registeredBy ?? undefined,
          customer: body.customer ?? undefined,
        },
        admin,
      )
      return { success: true, data: item }
    }
    case 'GET': {
      const q = getQuery(event)
      const result = await inventoryService.list({
        itemId: typeof q.itemId === 'string' ? q.itemId : undefined,
        type: typeof q.type === 'string' ? q.type : undefined,
        page: q.page ? Number(q.page) : undefined,
        pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      })
      return { success: true, ...result }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
