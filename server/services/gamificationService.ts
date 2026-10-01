import { prisma } from '~/server/utils/db'
import {
  xpForRarity,
  levelFromXp,
  xpIntoLevel,
  XP_PER_LEVEL,
  COLLECTION_COMPLETE_BONUS,
  ACHIEVEMENT_KEYS,
} from '~/utils/gamification'

export interface GamificationState {
  xp: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  collectedItems: number
  completedCollections: number
  unlockedKeys: string[]
}

export interface AchievementDto {
  key: string
  name: string
  description: string | null
  icon: string | null
  xpReward: number
  unlocked: boolean
  unlockedAt: Date | null
}

/**
 * Recalcula XP/nivel e insignias del usuario a partir de su estado real
 * (idempotente; sin contadores que se desincronicen). Se ejecuta tras
 * conseguir/des-conseguir una pieza.
 */
export const gamificationService = {
  async recompute(userId: string): Promise<GamificationState> {
    const collected = await prisma.userCollectedItem.findMany({
      where: { userId },
      include: { item: { select: { rarity: true } } },
    })
    const baseXp = collected.reduce((sum, c) => sum + xpForRarity(c.item.rarity), 0)

    const collections = await prisma.collection.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, items: { where: { status: { not: 'ARCHIVED' } }, select: { id: true } } },
    })
    const collectedIds = new Set(collected.map((c) => c.itemId))
    const completedCollections = collections.filter(
      (col) => col.items.length > 0 && col.items.every((i) => collectedIds.has(i.id)),
    ).length

    const conditions: Record<string, boolean> = {
      [ACHIEVEMENT_KEYS.FIRST_ITEM]: collected.length >= 1,
      [ACHIEVEMENT_KEYS.COLLECTOR_10]: collected.length >= 10,
      [ACHIEVEMENT_KEYS.COLLECTION_COMPLETE]: completedCollections >= 1,
      [ACHIEVEMENT_KEYS.LEGENDARY_OWNER]: collected.some((c) => c.item.rarity === 'LEGENDARY'),
    }

    const definitions = await prisma.achievement.findMany()
    const existing = await prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } })
    const existingIds = new Set(existing.map((e) => e.achievementId))

    const toUnlock = definitions.filter((d) => !existingIds.has(d.id) && conditions[d.key])
    if (toUnlock.length) {
      await prisma.userAchievement.createMany({
        data: toUnlock.map((d) => ({ userId, achievementId: d.id })),
        skipDuplicates: true,
      })
    }

    const achievementXp = definitions
      .filter((d) => existingIds.has(d.id) || conditions[d.key])
      .reduce((sum, d) => sum + d.xpReward, 0)

    const xp = Math.max(0, baseXp + completedCollections * COLLECTION_COMPLETE_BONUS + achievementXp)
    await prisma.user.update({ where: { id: userId }, data: { xp } })

    return {
      xp,
      level: levelFromXp(xp),
      xpIntoLevel: xpIntoLevel(xp),
      xpForNextLevel: XP_PER_LEVEL,
      collectedItems: collected.length,
      completedCollections,
      unlockedKeys: toUnlock.map((d) => d.key),
    }
  },

  async getAchievements(userId?: string) {
    const definitions = await prisma.achievement.findMany({ orderBy: { sortOrder: 'asc' } })
    const unlocked = userId
      ? await prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true, unlockedAt: true } })
      : []
    const unlockMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]))

    const data: AchievementDto[] = definitions.map((d) => ({
      key: d.key,
      name: d.name,
      description: d.description,
      icon: d.icon,
      xpReward: d.xpReward,
      unlocked: unlockMap.has(d.id),
      unlockedAt: unlockMap.get(d.id) ?? null,
    }))

    return { data, unlocked: data.filter((d) => d.unlocked).length, total: data.length }
  },
}
