import { collectionService } from '~/server/services/collectionService'
import { getCurrentUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const user = await getCurrentUser(event)
  const result = await collectionService.listPublic({
    tag: typeof q.tag === 'string' && q.tag ? q.tag : undefined,
    q: typeof q.q === 'string' && q.q ? q.q : undefined,
    sort: typeof q.sort === 'string' && q.sort ? q.sort : undefined,
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
  }, user?.id)
  return { success: true, ...result }
})
