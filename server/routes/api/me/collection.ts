import { requireUser } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const collected = await prisma.userCollectedItem.findMany({
    where: { userId: user.id },
    orderBy: { obtainedAt: 'desc' },
    include: {
      item: {
        include: {
          collection: { select: { name: true, slug: true } },
          files: { include: { file: true }, orderBy: { position: 'asc' } },
        },
      },
    },
  })

  const data = collected.map((c) => {
    const main = c.item.files.find((f) => f.position === 0)
    return {
      id: c.id,
      obtainedAt: c.obtainedAt,
      item: {
        id: c.item.id,
        name: c.item.name,
        slug: c.item.slug,
        image: main ? { url: main.file.url, alt: main.alt } : null,
        collection: c.item.collection,
      },
    }
  })

  return { success: true, data, total: data.length }
})
