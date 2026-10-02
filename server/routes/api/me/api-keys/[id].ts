import { apiKeyService } from '~/server/services/apiKeyService'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id' })

  if (event.method !== 'DELETE') {
    throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }

  return { success: true, data: await apiKeyService.revoke(user.id, id) }
})
