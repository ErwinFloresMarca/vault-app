import { fileService } from '~/server/services/fileService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el id del item' })
  }

  const data = await fileService.localizeItemImages(id)
  return { success: true, data }
})
