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

  /**
   * Registra una URL externa como `File` (sin subir binario). Allowlist
   * anti-SSRF: solo `/uploads/…` o `https://images.unsplash.com`.
   */
  async registerUrl(input: { url: string; mimeType?: string }) {
    const url = input.url.trim()
    const allowed =
      url.startsWith('/uploads/') ||
      (() => {
        try {
          const u = new URL(url)
          return u.protocol === 'https:' && u.hostname === 'images.unsplash.com'
        } catch {
          return false
        }
      })()

    if (!allowed) {
      throw createError({
        statusCode: 422,
        statusMessage: 'URL no permitida (solo /uploads/… o https://images.unsplash.com)',
      })
    }

    const existing = await prisma.file.findUnique({ where: { url } })
    if (existing) return existing

    return prisma.file.create({ data: { url, mimeType: input.mimeType ?? null } })
  },
}
