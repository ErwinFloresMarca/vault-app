import { requireUser } from '~/server/utils/auth'
import { userService } from '~/server/services/userService'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const result = await userService.listCollected(user.id)
  return { success: true, ...result }
})
