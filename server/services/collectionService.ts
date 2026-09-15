import type { H3Event } from 'h3'
import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import type { Prisma } from '@gen-prisma/client'
import type { CollectionSummary, CollectionWithItems, ItemSummary, CollectionProgress, CollectionStatus, FileDto, UserStats } from '~/types'

type CollectionSummaryInclude = {
  _count: { select: { items: true } }
  tags: { include: { tag: true } }
  files: { include: { file: true } }
}

type CollectionSummaryPayload = Prisma.CollectionGetPayload<{ include: CollectionSummaryInclude }>

type ItemWithFilesPayload = Prisma.CollectionItemGetPayload<{
  include: { files: { include: { file: true } } }
}>

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let candidate = slug
  let n = 2
  while (true) {
    const existing = await prisma.collection.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    })
    if (!existing) return candidate
    candidate = `${slug}-${n}`
    n += 1
  }
}

function toFiles(files: { file: { id: string; url: string }; alt: string | null; position: number }[]): FileDto[] {
  return files.map((cf) => ({ id: cf.file.id, url: cf.file.url, alt: cf.alt, position: cf.position }))
}

function toCollectionSummary(c: CollectionSummaryPayload): CollectionSummary {
  const files = toFiles(c.files)
  const cover = files.find((f) => f.position === 0)
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    status: c.status,
    coverImage: cover ?? null,
    tags: c.tags.map((ct) => ({ id: ct.tag.id, name: ct.tag.name, slug: ct.tag.slug })),
    itemCount: c._count.items ?? 0,
  }
}

function toItemSummary(i: ItemWithFilesPayload): ItemSummary {
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
    rarity: i.rarity,
    mainImage: main ?? null,
  }
}

async function computeProgress(collectionId: string, userId: string | undefined): Promise<CollectionProgress | null> {
  if (!userId) return null
  const items = await prisma.collectionItem.findMany({
    where: { collectionId },
    select: { id: true },
  })
  const collectedRows = await prisma.userCollectedItem.findMany({
    where: { userId, itemId: { in: items.map((i) => i.id) } },
    select: { itemId: true },
  })
  const collectedItemIds = collectedRows.map((r) => r.itemId)
  const total = items.length
  const collected = collectedItemIds.length
  return {
    total,
    collected,
    percent: total === 0 ? 0 : Math.round((collected / total) * 100),
    collectedItemIds,
  }
}

export const collectionService = {
  async listPublic(query: { tag?: string; q?: string; page?: number; pageSize?: number } = {}) {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12))

    const where: Prisma.CollectionWhereInput = { status: 'PUBLISHED' }
    if (query.tag) where.tags = { some: { tag: { slug: query.tag } } }
    const q = query.q?.trim()
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, collections] = await Promise.all([
      prisma.collection.count({ where }),
      prisma.collection.findMany({
        where,
        orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { items: true } },
          tags: { include: { tag: true } },
          files: { include: { file: true }, orderBy: { position: 'asc' } },
          items: { where: { status: { not: 'ARCHIVED' } }, select: { id: true } },
        },
      }),
    ])
    return { data: collections.map(toCollectionSummary), total, page, pageSize }
  },

  async listTags(): Promise<{ id: string; name: string; slug: string }[]> {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    })
  },

  async getUserStats(userId: string): Promise<UserStats> {
    const collections = await prisma.collection.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, items: { where: { status: { not: 'ARCHIVED' } }, select: { id: true } } },
    })
    const allItemIds = collections.flatMap((c) => c.items.map((i) => i.id))
    const collected = allItemIds.length
      ? await prisma.userCollectedItem.findMany({
          where: { userId, itemId: { in: allItemIds } },
          select: { itemId: true },
        })
      : []
    const collectedSet = new Set(collected.map((c) => c.itemId))
    const totalItems = allItemIds.length
    const collectedItems = collectedSet.size
    const completedCollections = collections.filter(
      (c) => c.items.length > 0 && c.items.every((i) => collectedSet.has(i.id)),
    ).length
    return {
      totalItems,
      collectedItems,
      percent: totalItems === 0 ? 0 : Math.round((collectedItems / totalItems) * 100),
      collections: collections.length,
      completedCollections,
    }
  },

  async getBySlug(slug: string, userId?: string): Promise<CollectionWithItems | null> {
    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        _count: { select: { items: true } },
        tags: { include: { tag: true } },
        files: { include: { file: true }, orderBy: { position: 'asc' } },
        items: {
          where: { status: { not: 'ARCHIVED' } },
          orderBy: { orderIndex: 'asc' },
          include: {
            files: { include: { file: true }, orderBy: { position: 'asc' } },
            collectedBy: { select: { userId: true } },
          },
        },
      },
    })
    if (!collection) return null

    const itemSummaries = collection.items.map((i) => {
      const s = toItemSummary(i)
      return { ...s, collected: !!userId && i.collectedBy.some((cb) => cb.userId === userId) }
    })

    return {
      ...toCollectionSummary(collection),
      files: toFiles(collection.files),
      items: itemSummaries,
      progress: await computeProgress(collection.id, userId),
    }
  },

  async create(
    input: { name: string; description?: string; tags?: string[]; fileIds?: string[]; status?: CollectionStatus },
    event: H3Event,
  ) {
    await requireAdmin(event)
    const slug = await ensureUniqueSlug(slugify(input.name))
    const collection = await prisma.collection.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        status: input.status ?? 'PUBLISHED',
        tags: input.tags?.length ? { create: input.tags.map((tagId) => ({ tagId })) } : undefined,
        files: input.fileIds?.length
          ? { create: input.fileIds.map((fileId, idx) => ({ fileId, position: idx })) }
          : undefined,
      },
    })
    return collection
  },

  async update(
    id: string,
    input: { name?: string; description?: string; tags?: string[]; fileIds?: string[]; status?: CollectionStatus },
    event: H3Event,
  ) {
    await requireAdmin(event)
    const existing = await prisma.collection.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })

    const data: Prisma.CollectionUpdateInput = {}
    if (input.name) {
      const slug = await ensureUniqueSlug(slugify(input.name), id)
      data.name = input.name
      data.slug = slug
    }
    if (input.description !== undefined) data.description = input.description
    if (input.status !== undefined) data.status = input.status

    const collection = await prisma.$transaction(async (tx) => {
      if (input.tags) {
        await tx.collectionTag.deleteMany({ where: { collectionId: id } })
        if (input.tags.length) {
          await tx.collectionTag.createMany({ data: input.tags.map((tagId) => ({ collectionId: id, tagId })) })
        }
      }
      if (input.fileIds) {
        await tx.collectionFile.deleteMany({ where: { collectionId: id } })
        if (input.fileIds.length) {
          await tx.collectionFile.createMany({ data: input.fileIds.map((fileId, idx) => ({ collectionId: id, fileId, position: idx })) })
        }
      }
      return tx.collection.update({ where: { id }, data })
    })
    return collection
  },

  async remove(id: string, event: H3Event) {
    await requireAdmin(event)
    // Soft delete: pasa a ARCHIVED (conserva historial)
    return prisma.collection.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  },
}
