import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import type { ItemDetail, ItemSummary } from '~/types'

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function ensureUniqueItemSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug
  let n = 2
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.collectionItem.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    })
    if (!existing) return candidate
    candidate = `${slug}-${n}`
    n += 1
  }
}

function toFiles(files: any[]): { id: string; url: string; alt: string | null; position: number }[] {
  return files?.map((f) => ({ id: f.file.id, url: f.file.url, alt: f.alt, position: f.position })) ?? []
}

function toItemSummary(i: any): ItemSummary {
  const files = toFiles(i.files)
  const main = files.find((f) => f.position === 0)
  return {
    id: i.id,
    name: i.name,
    slug: i.slug,
    description: i.description,
    stock: i.stock,
    soldQuantity: i.soldQuantity,
    status: i.status,
    mainImage: main ?? null,
  }
}

export const itemService = {
  /**
   * Crea un item (admin). Si recibe stockInicial, genera un movimiento IN atómico.
   */
  async create(input: {
    collectionId: string
    name: string
    description?: string
    fileIds?: string[]
    stockInicial?: number
    status?: any
  }, event: any) {
    await requireAdmin(event)

    const collection = await prisma.collection.findUnique({ where: { id: input.collectionId } })
    if (!collection) throw createError({ statusCode: 422, statusMessage: 'La colección no existe' })

    const slug = await ensureUniqueItemSlug(slugify(input.name))
    const stockInicial = Math.max(0, input.stockInicial ?? 0)

    return prisma.$transaction(async (tx) => {
      const item = await tx.collectionItem.create({
        data: {
          collectionId: input.collectionId,
          name: input.name,
          slug,
          description: input.description,
          status: input.status ?? 'AVAILABLE',
          files: input.fileIds?.length
            ? { create: input.fileIds.map((fileId, idx) => ({ fileId, position: idx })) }
            : undefined,
        },
      })

      if (stockInicial > 0) {
        await tx.inventoryMovement.create({
          data: { itemId: item.id, type: 'IN', quantity: stockInicial, reason: 'stock inicial' },
        })
        await tx.collectionItem.update({
          where: { id: item.id },
          data: { stock: stockInicial },
        })
      }
      return item
    })
  },

  async update(id: string, input: {
    name?: string
    description?: string
    fileIds?: string[]
    status?: any
  }, event: any) {
    await requireAdmin(event)
    const existing = await prisma.collectionItem.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

    const data: any = {}
    if (input.name) {
      const slug = await ensureUniqueItemSlug(slugify(input.name), id)
      data.name = input.name
      data.slug = slug
    }
    if (input.description !== undefined) data.description = input.description
    if (input.status !== undefined) data.status = input.status

    return prisma.$transaction(async (tx) => {
      if (input.fileIds) {
        await tx.itemFile.deleteMany({ where: { itemId: id } })
        if (input.fileIds.length) {
          await tx.itemFile.createMany({ data: input.fileIds.map((fileId, idx) => ({ itemId: id, fileId, position: idx })) })
        }
      }
      return tx.collectionItem.update({ where: { id }, data })
    })
  },

  async remove(id: string, event: any) {
    await requireAdmin(event)
    return prisma.collectionItem.update({ where: { id }, data: { status: 'ARCHIVED' } })
  },

  async getBySlug(slug: string, userId?: string): Promise<ItemDetail | null> {
    const item = await prisma.collectionItem.findUnique({
      where: { slug },
      include: {
        collection: { select: { id: true, name: true, slug: true } },
        files: { include: { file: true }, orderBy: { position: 'asc' } },
        collectedBy: { select: { userId: true } },
      },
    })
    if (!item) return null

    const base = toItemSummary(item)
    return {
      ...base,
      collection: item.collection,
      files: toFiles(item.files),
      tags: [],
      collected: !!userId && item.collectedBy.some((cb) => cb.userId === userId),
    }
  },

  async listByCollectionSlug(collectionSlug: string, userId?: string): Promise<ItemSummary[]> {
    const collection = await prisma.collection.findUnique({ where: { slug: collectionSlug } })
    if (!collection) return []
    const items = await prisma.collectionItem.findMany({
      where: { collectionId: collection.id, status: { not: 'ARCHIVED' } },
      orderBy: { orderIndex: 'asc' },
      include: {
        files: { include: { file: true }, orderBy: { position: 'asc' } },
        collectedBy: { select: { userId: true } },
      },
    })
    return items.map((i) => ({
      ...toItemSummary(i),
      collected: !!userId && i.collectedBy.some((cb) => cb.userId === userId),
    }))
  },
}
