import { collectionService } from '~/server/services/collectionService'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Falta slug' })

  const user = await getCurrentUser(event)
  const collection = await collectionService.getBySlug(slug, user?.id)

  if (!collection) {
    throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })
  }
  // Solo publicidad: un visitante no autenticado solo ve PUBLICADO
  if (!user && collection.status !== 'PUBLISHED') {
    throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })
  }

  return { success: true, data: collection }
})
