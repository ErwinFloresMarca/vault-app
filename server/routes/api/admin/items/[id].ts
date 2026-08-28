import { itemService } from '~/server/services/itemService'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id' })

  switch (event.method) {
    case 'GET': {
      await requireAdmin(event)
      const item = await prisma.collectionItem.findUnique({
        where: { id },
        include: {
          collection: { select: { id: true, name: true, slug: true } },
          files: { include: { file: true }, orderBy: { position: 'asc' } },
          movements: { orderBy: { createdAt: 'desc' } },
          collectedBy: { select: { userId: true } },
        },
      })
      if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
      return { success: true, data: item }
    }
    case 'PUT': {
      const body = await readBody(event)
      const item = await itemService.update(id, body, event)
      return { success: true, data: item }
    }
    case 'DELETE': {
      const item = await itemService.remove(id, event)
      return { success: true, data: item }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
