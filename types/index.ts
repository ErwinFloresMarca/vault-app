// Tipos de dominio de Volt Vault compartidos entre frontend y backend.

export type CollectionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type ItemStatus = 'DRAFT' | 'AVAILABLE' | 'SOLD_OUT' | 'ARCHIVED'
export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

export interface FileDto {
  id: string
  url: string
  alt?: string | null
  position: number
}

export interface TagDto {
  id: string
  name: string
  slug: string
}

export interface CollectionSummary {
  id: string
  name: string
  slug: string
  description?: string | null
  status: CollectionStatus
  coverImage?: FileDto | null
  tags: TagDto[]
  itemCount: number
  progress?: { total: number; collected: number; percent: number } | null
}

export interface CollectionWithItems extends CollectionSummary {
  files: FileDto[]
  items: ItemSummary[]
  // progreso del usuario autenticado (opcional)
  progress?: CollectionProgress | null
}

export interface ItemSummary {
  id: string
  name: string
  slug: string
  description?: string | null
  stock: number
  soldQuantity: number
  status: ItemStatus
  rarity: Rarity
  mainImage?: FileDto | null
  collected?: boolean
}

export interface ItemDetail extends ItemSummary {
  collection: {
    id: string
    name: string
    slug: string
  }
  files: FileDto[]
  tags: TagDto[]
  spec?: ItemSpecDto | null
  wishlisted?: boolean
  collectedCount?: number
  wishlistCount?: number
}

export interface ItemSpecDto {
  scale?: string | null
  material?: string | null
  lighting?: string | null
  base?: string | null
}

export interface CollectionProgress {
  total: number
  collected: number
  percent: number
  collectedItemIds: string[]
}

export interface UserStats {
  totalItems: number
  collectedItems: number
  percent: number
  collections: number
  completedCollections: number
  xp: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
}

export interface Achievement {
  key: string
  name: string
  description: string | null
  icon: string | null
  xpReward: number
  unlocked: boolean
  unlockedAt: string | null
}
