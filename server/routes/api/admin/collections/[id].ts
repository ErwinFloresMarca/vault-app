import { collectionService } from '~/server/services/collectionService'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id' })

  switch (event.method) {
    case 'GET': {
      await requireAdmin(event)
      const collection = await prisma.collection.findUnique({
        where: { id },
        include: {
          tags: { include: { tag: true } },
          files: { include: { file: true }, orderBy: { position: 'asc' } },
          items: { include: { _count: { select: { collectedBy: true } } }, orderBy: { orderIndex: 'asc' } },
        },
      })
      if (!collection) throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })
      return { success: true, data: collection }
    }
    case 'PUT': {
      const body = await readBody(event)
      const collection = await collectionService.update(id, body, event)
      return { success: true, data: collection }
    }
    case 'DELETE': {
      const collection = await collectionService.remove(id, event)
      return { success: true, data: collection }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
