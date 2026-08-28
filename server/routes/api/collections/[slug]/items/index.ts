import { itemService } from '~/server/services/itemService'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Falta slug' })

  const user = await getCurrentUser(event)
  const items = await itemService.listByCollectionSlug(slug, user?.id)
  return { success: true, data: items }
})
