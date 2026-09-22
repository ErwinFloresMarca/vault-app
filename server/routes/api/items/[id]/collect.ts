import { requireUser } from '~/server/utils/auth'
import { userService } from '~/server/services/userService'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Falta id del item' })

  switch (event.method) {
    case 'POST':
      return { success: true, ...(await userService.collect(user.id, id)) }
    case 'DELETE':
      return { success: true, ...(await userService.uncollect(user.id, id)) }
    default:
      throw createError({ statusCode: 405, statusMessage: 'Método no permitido' })
  }
})
