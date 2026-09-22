import { collectionService } from '~/server/services/collectionService'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  switch (event.method) {
    case 'POST': {
      await requireAdmin(event)
      const body = await readBody(event)
      if (!body?.name) throw createError({ statusCode: 422, statusMessage: 'El nombre es obligatorio' })
      const collection = await collectionService.create(body)
      return { success: true, data: collection }
    }
    case 'GET': {
      await requireAdmin(event)
      const collections = await prisma.collection.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
          files: { include: { file: true }, orderBy: { position: 'asc' } },
        },
      })
      return { success: true, data: collections }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
