import { collectionService } from '~/server/services/collectionService'

export default defineEventHandler(async () => {
  const tags = await collectionService.listTags()
  return { success: true, data: tags }
})
