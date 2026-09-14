import { collectionService } from '~/server/services/collectionService'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const result = await collectionService.listPublic({
    tag: typeof q.tag === 'string' && q.tag ? q.tag : undefined,
    q: typeof q.q === 'string' && q.q ? q.q : undefined,
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
  })
  return { success: true, ...result }
})
