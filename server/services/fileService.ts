import { prisma } from '~/server/utils/db'

export const fileService = {
  async list(page = 1, pageSize = 50) {
    const currentPage = Math.max(1, page)
    const take = Math.min(100, Math.max(1, pageSize))
    const [total, files] = await Promise.all([
      prisma.file.count(),
      prisma.file.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * take,
        take,
      }),
    ])
    return { data: files, total, page: currentPage, pageSize: take }
  },
}
