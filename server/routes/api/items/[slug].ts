import { itemService } from '~/server/services/itemService'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Falta slug' })

  const user = await getCurrentUser(event)
  const item = await itemService.getBySlug(slug, user?.id)

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
  }
  if (!user && item.status !== 'AVAILABLE' && item.status !== 'SOLD_OUT') {
    throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
  }

  return { success: true, data: item }
})
