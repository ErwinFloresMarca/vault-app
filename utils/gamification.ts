import type { Rarity } from '~/types'

/** XP otorgado por conseguir una pieza según su rareza. */
export const XP_PER_RARITY: Record<Rarity, number> = {
  COMMON: 50,
  RARE: 150,
  EPIC: 350,
  LEGENDARY: 1000,
}

/** XP necesaria para subir de nivel. */
export const XP_PER_LEVEL = 500

/** Bonus por completar una colección al 100%. */
export const COLLECTION_COMPLETE_BONUS = 500

export function xpForRarity(rarity: Rarity): number {
  return XP_PER_RARITY[rarity] ?? XP_PER_RARITY.COMMON
}

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1
}

export function xpIntoLevel(xp: number): number {
  return Math.max(0, xp) % XP_PER_LEVEL
}

/** Claves de insignias conocidas (definidas en el seed). */
export const ACHIEVEMENT_KEYS = {
  FIRST_ITEM: 'first-item',
  COLLECTOR_10: 'collector-10',
  COLLECTION_COMPLETE: 'collection-complete',
  LEGENDARY_OWNER: 'legendary-owner',
} as const
