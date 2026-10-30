import { makerworldImportService } from '~/server/services/makerworldImportService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ url?: string }>(event)
  if (!body?.url?.trim()) {
    throw createError({ statusCode: 422, statusMessage: 'Falta la URL de MakerWorld' })
  }

  const data = await makerworldImportService.resolve({ url: body.url })
  return { success: true, data }
})
