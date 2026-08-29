import { inventoryService } from '~/server/services/inventoryService'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const result = await inventoryService.listBatches({
    collectionId: typeof q.collectionId === 'string' ? q.collectionId : undefined,
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
  })

  return { success: true, ...result }
})
