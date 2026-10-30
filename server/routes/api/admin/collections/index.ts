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
      const q = getQuery(event)
      const include = {
        _count: { select: { items: true } },
        files: { include: { file: true }, orderBy: { position: 'asc' as const } },
      }

      const pageParam = typeof q.page === 'string' ? Number(q.page) : undefined
      const pageSizeParam = typeof q.pageSize === 'string' ? Number(q.pageSize) : undefined

      if (pageParam !== undefined && Number.isFinite(pageParam)) {
        const page = Math.max(1, Math.floor(pageParam))
        const pageSize = Math.min(100, Math.max(1, Math.floor(pageSizeParam ?? 20)))
        const [total, collections] = await Promise.all([
          prisma.collection.count(),
          prisma.collection.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include,
          }),
        ])
        return { success: true, data: collections, total, page, pageSize }
      }

      // Compatibilidad: sin `page` se devuelven todas (selectores, import, etc.).
      const collections = await prisma.collection.findMany({
        orderBy: { createdAt: 'desc' },
        include,
      })
      return { success: true, data: collections, total: collections.length, page: 1, pageSize: collections.length }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
