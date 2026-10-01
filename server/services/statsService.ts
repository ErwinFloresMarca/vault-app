import { prisma } from '~/server/utils/db'

/** Métricas de vitrina pública (conteos reales, sin datos decorativos). */
export const statsService = {
  async getPublicStats() {
    const [collections, items, legendary, collectors, collected] = await Promise.all([
      prisma.collection.count({ where: { status: 'PUBLISHED' } }),
      prisma.collectionItem.count({ where: { status: { not: 'ARCHIVED' } } }),
      prisma.collectionItem.count({ where: { rarity: 'LEGENDARY', status: { not: 'ARCHIVED' } } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.userCollectedItem.count(),
    ])
    return { collections, items, legendary, collectors, collected }
  },

  async getAdminStats() {
    const [collections, items, users, collected, soldAgg, top, recent] = await Promise.all([
      prisma.collection.count(),
      prisma.collectionItem.count(),
      prisma.user.count(),
      prisma.userCollectedItem.count(),
      prisma.collectionItem.aggregate({ _sum: { soldQuantity: true }, _avg: { soldQuantity: true } }),
      prisma.collectionItem.findMany({
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { soldQuantity: 'desc' },
        take: 5,
        include: { collection: { select: { name: true, slug: true } } },
      }),
      prisma.userCollectedItem.findMany({
        orderBy: { obtainedAt: 'desc' },
        take: 6,
        include: { user: { select: { name: true, email: true } }, item: { select: { name: true, slug: true } } },
      }),
    ])

    return {
      counts: { collections, items, users, collected },
      sales: { total: soldAgg._sum.soldQuantity ?? 0, avg: soldAgg._avg.soldQuantity ?? 0 },
      top: top.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        soldQuantity: t.soldQuantity,
        stock: t.stock,
        status: t.status,
        collection: t.collection,
      })),
      recent: recent.map((r) => ({
        obtainedAt: r.obtainedAt,
        user: r.user,
        item: { name: r.item.name, slug: r.item.slug },
      })),
    }
  },
}
