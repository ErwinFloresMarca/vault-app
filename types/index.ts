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
}
