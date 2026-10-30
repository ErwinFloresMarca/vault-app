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

// ===== API keys de MCP (configuración por usuario) =====

export const MCP_SCOPES = [
  'catalog:read',
  'catalog:write',
  'files:write',
  'inventory:read',
  'inventory:write',
  'personal:read',
  'personal:write',
  'stats:read',
  'users:read',
  'users:write',
  'keys:read',
  'keys:write',
] as const

export type McpScope = (typeof MCP_SCOPES)[number]

/** Scopes que exigen rol ADMIN. */
export const ADMIN_MCP_SCOPES: McpScope[] = ['stats:read', 'users:read', 'users:write']

export interface ApiKeyDto {
  id: string
  name: string
  prefix: string
  scopes: McpScope[]
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

// ===== Importación desde MakerWorld (m19) =====

export interface MakerworldCreator {
  name: string
  handle: string
}

export interface MakerworldPreviewItem {
  id: number
  title: string
  creator: MakerworldCreator | null
  coverUrl: string | null
  sourceUrl: string
  existing: { itemId: string; collectionId: string; collectionName: string } | null
}

export interface MakerworldResolveResult {
  source: { type: 'collection' | 'model'; collectionId?: number; title: string; total: number }
  suggestedCollectionName: string
  suggestedCollectionDescription: string | null
  items: MakerworldPreviewItem[]
}

export interface MakerworldBatchInput {
  modelIds: number[]
  collectionId?: string
  newCollection?: { name: string; description?: string }
  itemStatus?: ItemStatus
  collectionStatus?: CollectionStatus
  updateExisting?: boolean
  setCollectionCover?: boolean
}

export interface MakerworldBatchItemResult {
  id: number
  itemId?: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  license?: string | null
  error?: string
}

export interface MakerworldBatchResult {
  collectionId: string
  collectionSlug: string
  created: number
  updated: number
  skipped: number
  errors: Array<{ id: number; message: string }>
  items: MakerworldBatchItemResult[]
}
