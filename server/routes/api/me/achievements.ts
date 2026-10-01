import { gamificationService } from '~/server/services/gamificationService'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getCurrentUser(event)
  const result = await gamificationService.getAchievements(user?.id)
  return { success: true, ...result }
})
