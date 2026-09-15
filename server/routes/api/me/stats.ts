import { collectionService } from '~/server/services/collectionService'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const stats = await collectionService.getUserStats(user.id)
  return { success: true, data: stats }
})
