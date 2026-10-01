import { statsService } from '~/server/services/statsService'

export default defineEventHandler(async () => {
  const data = await statsService.getPublicStats()
  return { success: true, data }
})
