import { requireAdmin } from '~/server/utils/auth'
import { userService } from '~/server/services/userService'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const data = await userService.listUsers({
    role: q.role === 'USER' ? 'USER' : undefined,
    search: typeof q.search === 'string' && q.search ? q.search : undefined,
  })
  return { success: true, data }
})
