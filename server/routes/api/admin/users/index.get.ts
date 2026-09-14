import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import type { Prisma } from '@gen-prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const search = typeof q.search === 'string' && q.search ? q.search : undefined
  const onlyClients = q.role === 'USER'

  const where: Prisma.UserWhereInput = {}
  if (onlyClients) where.role = 'USER'
  if (search) {
    where.OR = [{ name: { contains: search } }, { email: { contains: search, mode: 'insensitive' } }]
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    take: 100,
  })

  return { success: true, data: users }
})
