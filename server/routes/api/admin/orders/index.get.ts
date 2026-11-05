import { orderService } from '~/server/services/orderService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
  const result = await orderService.list({
    status: str(q.status),
    from: str(q.from),
    to: str(q.to),
    q: str(q.q),
    page: str(q.page) ? Number(q.page) : undefined,
    pageSize: str(q.pageSize) ? Number(q.pageSize) : undefined,
  })
  return { success: true, ...result }
})
