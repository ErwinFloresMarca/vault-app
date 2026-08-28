import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

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
    success: true,
    data: {
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
    },
  }
})
