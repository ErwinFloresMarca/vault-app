import { apiKeyService } from '~/server/services/apiKeyService'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  switch (event.method) {
    case 'GET':
      return { success: true, data: await apiKeyService.list(user.id) }
    case 'POST': {
      const body = await readBody(event)
      const result = await apiKeyService.create(user.id, user.role, {
        name: body?.name,
        scopes: Array.isArray(body?.scopes) ? body.scopes : [],
        expiresInDays: body?.expiresInDays ? Number(body.expiresInDays) : undefined,
      })
      return { success: true, ...result }
    }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
