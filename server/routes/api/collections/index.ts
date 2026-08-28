import { collectionService } from '~/server/services/collectionService'

export default defineEventHandler(async () => {
  const collections = await collectionService.listPublic()
  return { success: true, data: collections }
})
