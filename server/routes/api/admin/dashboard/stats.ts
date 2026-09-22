import { statsService } from '~/server/services/statsService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const data = await statsService.getAdminStats()
  return { success: true, data }
})
