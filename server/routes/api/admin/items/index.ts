import { itemService } from '~/server/services/itemService'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import type { ItemStatus, Prisma, Rarity } from '@gen-prisma/client'

const ITEM_STATUSES = new Set<string>(['DRAFT', 'AVAILABLE', 'SOLD_OUT', 'ARCHIVED'])
const RARITIES = new Set<string>(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'])

export default defineEventHandler(async (event) => {
  switch (event.method) {
    case 'POST': {
      await requireAdmin(event)
      const body = await readBody(event)
      if (!body?.name || !body?.collectionId) {
        throw createError({ statusCode: 422, statusMessage: 'Faltan campos obligatorios (name, collectionId)' })
      }
      const item = await itemService.create(body)
      return { success: true, data: item }
    }
    case 'GET': {
      await requireAdmin(event)
      const q = getQuery(event)

      const where: Prisma.CollectionItemWhereInput = {}
      if (typeof q.collectionId === 'string' && q.collectionId) {
        where.collectionId = q.collectionId
      }
      if (typeof q.status === 'string' && ITEM_STATUSES.has(q.status)) {
        where.status = q.status as ItemStatus
      }
      if (typeof q.rarity === 'string' && RARITIES.has(q.rarity)) {
        where.rarity = q.rarity as Rarity
      }
      if (typeof q.q === 'string' && q.q.trim()) {
        const search = q.q.trim()
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ]
      }

      const include = {
        collection: { select: { name: true, slug: true } },
        spec: true,
        _count: { select: { collectedBy: true } },
        files: { include: { file: true }, orderBy: { position: 'asc' as const } },
      } satisfies Prisma.CollectionItemInclude

      const pageParam = typeof q.page === 'string' ? Number(q.page) : undefined
      const pageSizeParam = typeof q.pageSize === 'string' ? Number(q.pageSize) : undefined

      if (pageParam !== undefined && Number.isFinite(pageParam)) {
        const page = Math.max(1, Math.floor(pageParam))
        const pageSize = Math.min(100, Math.max(1, Math.floor(pageSizeParam ?? 20)))
        const [total, items] = await Promise.all([
          prisma.collectionItem.count({ where }),
          prisma.collectionItem.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include,
          }),
        ])
        return { success: true, data: items, total, page, pageSize }
      }

      // Compatibilidad: sin `page` se devuelve todo (inventario, modal de batch).
      const items = await prisma.collectionItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include,
      })
      return { success: true, data: items, total: items.length, page: 1, pageSize: items.length }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
