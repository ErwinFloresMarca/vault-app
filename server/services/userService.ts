import { prisma } from '~/server/utils/db'
import { gamificationService } from '~/server/services/gamificationService'
import type { Prisma, UserRole } from '@gen-prisma/client'

export const userService = {
  /** Lista usuarios (admin/MCP). */
  async listUsers(filters: { role?: UserRole; search?: string; take?: number } = {}) {
    const where: Prisma.UserWhereInput = {}
    if (filters.role) where.role = filters.role
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    return prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
      take: Math.min(200, Math.max(1, filters.take ?? 100)),
    })
  },

  /** Cambia el rol de un usuario (admin/MCP). */
  async setRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })
  },

  /** Obtiene un usuario por id (admin/MCP). */
  async getUser(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'Usuario no encontrado' })
    return user
  },

  /** Marca un item como conseguido (idempotente). */
  async collect(userId: string, itemId: string) {
    const item = await prisma.collectionItem.findUnique({ where: { id: itemId } })
    if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
    await prisma.userCollectedItem.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: {},
      create: { userId, itemId, obtainedAt: new Date() },
    })
    const gamification = await gamificationService.recompute(userId)
    return { collected: true, gamification }
  },

  async uncollect(userId: string, itemId: string) {
    await prisma.userCollectedItem.deleteMany({ where: { userId, itemId } })
    const gamification = await gamificationService.recompute(userId)
    return { collected: false, gamification }
  },

  /** Items conseguidos por el usuario (colección personal). */
  async listCollected(userId: string) {
    const collected = await prisma.userCollectedItem.findMany({
      where: { userId },
      orderBy: { obtainedAt: 'desc' },
      include: {
        item: {
          include: {
            collection: { select: { name: true, slug: true } },
            files: { include: { file: true }, orderBy: { position: 'asc' } },
          },
        },
      },
    })
    const data = collected.map((c) => {
      const main = c.item.files.find((f) => f.position === 0)
      return {
        id: c.id,
        obtainedAt: c.obtainedAt,
        item: {
          id: c.item.id,
          name: c.item.name,
          slug: c.item.slug,
          image: main ? { url: main.file.url, alt: main.alt } : null,
          collection: c.item.collection,
        },
      }
    })
    return { data, total: data.length }
  },

  async addWishlist(userId: string, itemId: string) {
    const item = await prisma.collectionItem.findUnique({ where: { id: itemId } })
    if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
    await prisma.userWishlistItem.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: {},
      create: { userId, itemId },
    })
    return { wishlisted: true }
  },

  async removeWishlist(userId: string, itemId: string) {
    await prisma.userWishlistItem.deleteMany({ where: { userId, itemId } })
    return { wishlisted: false }
  },
}
