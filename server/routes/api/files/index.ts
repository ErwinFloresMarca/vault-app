import { prisma } from '~/server/utils/db'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  return prisma.file.findMany({ orderBy: { createdAt: 'desc' } })
})
