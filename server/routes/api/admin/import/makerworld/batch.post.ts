import { makerworldImportService } from '~/server/services/makerworldImportService'
import { requireAdmin } from '~/server/utils/auth'
import type { MakerworldBatchInput } from '~/types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<MakerworldBatchInput>(event)
  if (!Array.isArray(body?.modelIds) || body.modelIds.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'Falta la lista de modelos a importar' })
  }

  const data = await makerworldImportService.importBatch(body)
  return { success: true, data }
})
