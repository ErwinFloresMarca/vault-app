import { requireUser } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id del item' })

  const item = await prisma.collectionItem.findUnique({ where: { id } })
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

  switch (event.method) {
    case 'POST': {
      // Idempotente: si ya está en la lista no hace nada
      await prisma.userWishlistItem.upsert({
        where: { userId_itemId: { userId: user.id, itemId: id } },
        update: {},
        create: { userId: user.id, itemId: id },
      })
      return { success: true, wishlisted: true }
    }
    case 'DELETE': {
      await prisma.userWishlistItem.deleteMany({
        where: { userId: user.id, itemId: id },
      })
      return { success: true, wishlisted: false }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
