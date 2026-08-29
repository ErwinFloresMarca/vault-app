import { itemService } from '~/server/services/itemService'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  switch (event.method) {
    case 'POST': {
      const body = await readBody(event)
      if (!body?.name || !body?.collectionId) {
        throw createError({ statusCode: 422, statusMessage: 'Faltan campos obligatorios (name, collectionId)' })
      }
      const item = await itemService.create(body, event)
      return { success: true, data: item }
    }
    case 'GET': {
      await requireAdmin(event)
      const q = getQuery(event)
      const where: any = {}
      if (typeof q.collectionId === 'string' && q.collectionId) {
        where.collectionId = q.collectionId
      }
      const items = await prisma.collectionItem.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          collection: { select: { name: true, slug: true } },
          _count: { select: { collectedBy: true } },
          files: { include: { file: true }, orderBy: { position: 'asc' } },
        },
      })
      return { success: true, data: items }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
