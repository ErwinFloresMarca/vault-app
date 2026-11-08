import { prisma } from '~/server/utils/db'
import { collectionService } from '~/server/services/collectionService'
import { fileService } from '~/server/services/fileService'
import {
  buildImportedDescription,
  canonicalModelUrl,
  makerworldService,
  normalizeImageUrl,
  parseCollectionId,
  parseModelId,
  type MakerworldDesign,
} from '~/server/services/makerworldService'
import type {
  MakerworldBatchInput,
  MakerworldBatchResult,
  MakerworldPreviewItem,
  MakerworldResolveResult,
} from '~/types'

/** Límite duro por colección para no bloquear el request ni abusar de MakerWorld. */
const MAX_COLLECTION_ITEMS = 500
/** El cliente envía lotes pequeños; el servidor también valida. */
const MAX_BATCH_SIZE = 25
const ALLOWED_ITEM_STATUS = new Set(['DRAFT', 'AVAILABLE', 'ON_DEMAND'])
const ALLOWED_COLLECTION_STATUS = new Set(['DRAFT', 'PUBLISHED'])

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function ensureUniqueItemSlug(slug: string): Promise<string> {
  const base = slug || 'item'
  let candidate = base
  let suffix = 2
  while (await prisma.collectionItem.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const candidate = error as { statusMessage?: string; message?: string }
    if (candidate.statusMessage) return candidate.statusMessage
    if (candidate.message) return candidate.message
  }
  return 'Error desconocido al importar el modelo'
}

function emptyPreview(id: number, title: string, sourceUrl: string, creator: MakerworldPreviewItem['creator'] = null, coverUrl: string | null = null): MakerworldPreviewItem {
  return { id, title, creator, coverUrl, sourceUrl, existing: null }
}

async function registerImages(design: MakerworldDesign): Promise<string[]> {
  const fileIds: string[] = []
  for (const url of design.imageUrls) {
    const file = await fileService.registerUrl({ url, mimeType: 'image/webp' })
    fileIds.push(file.id)
  }
  return fileIds
}

export const makerworldImportService = {
  /**
   * Resuelve una URL de colección o de modelo sin escribir en BD.
   */
  async resolve(input: { url: string }): Promise<MakerworldResolveResult> {
    const rawUrl = input.url?.trim()
    if (!rawUrl) throw createError({ statusCode: 422, statusMessage: 'Pega una URL de MakerWorld' })

    const collectionId = parseCollectionId(rawUrl)
    if (collectionId) {
      const collection = await makerworldService.getCollection(collectionId)
      const page = await makerworldService.listCollectionDesigns(collectionId)

      if (page.total > MAX_COLLECTION_ITEMS) {
        throw createError({
          statusCode: 422,
          statusMessage: `La colección tiene ${page.total} modelos; el máximo por importación es ${MAX_COLLECTION_ITEMS}. Divídela en varias colecciones.`,
        })
      }

      const sourceUrls = page.hits.map((hit) => canonicalModelUrl(hit.id))
      const existingRows = sourceUrls.length
        ? await prisma.collectionItem.findMany({
            where: { sourceUrl: { in: sourceUrls } },
            select: {
              id: true,
              sourceUrl: true,
              collectionId: true,
              collection: { select: { name: true } },
            },
          })
        : []
      const existingByUrl = new Map(existingRows.map((row) => [row.sourceUrl, row]))

      return {
        source: {
          type: 'collection',
          collectionId,
          title: collection.title,
          total: page.total,
        },
        suggestedCollectionName: collection.title,
        suggestedCollectionDescription: collection.description || null,
        items: page.hits.map((hit) => {
          const sourceUrl = canonicalModelUrl(hit.id)
          const existing = existingByUrl.get(sourceUrl)
          return {
            id: hit.id,
            title: hit.title,
            creator: hit.designCreator?.name
              ? { name: hit.designCreator.name, handle: hit.designCreator.handle ?? hit.designCreator.name }
              : null,
            coverUrl: normalizeImageUrl(hit.cover),
            sourceUrl,
            existing: existing
              ? { itemId: existing.id, collectionId: existing.collectionId, collectionName: existing.collection.name }
              : null,
          }
        }),
      }
    }

    const modelId = parseModelId(rawUrl)
    if (modelId) {
      const design = await makerworldService.getDesign(modelId)
      const sourceUrl = canonicalModelUrl(modelId)
      const existing = await prisma.collectionItem.findUnique({
        where: { sourceUrl },
        select: { id: true, collectionId: true, collection: { select: { name: true } } },
      })

      return {
        source: { type: 'model', title: design.title, total: 1 },
        suggestedCollectionName: design.title,
        suggestedCollectionDescription: null,
        items: [{
          ...emptyPreview(design.id, design.title, sourceUrl, design.creator, normalizeImageUrl(design.coverUrl)),
          existing: existing
            ? { itemId: existing.id, collectionId: existing.collectionId, collectionName: existing.collection.name }
            : null,
        }],
      }
    }

    throw createError({
      statusCode: 422,
      statusMessage: 'URL no válida. Pegá una URL de colección (/collections/{id}) o de modelo (/models/{id}) de MakerWorld.',
    })
  },

  /**
   * Importa un lote de modelos. Es idempotente por `sourceUrl`.
   * La colección se crea en el primer lote si no se pasa `collectionId`.
   */
  async importBatch(input: MakerworldBatchInput): Promise<MakerworldBatchResult> {
    const modelIds = Array.isArray(input.modelIds) ? input.modelIds : []
    const uniqueIds = [...new Set(modelIds)]

    if (uniqueIds.length === 0) {
      throw createError({ statusCode: 422, statusMessage: 'El lote no contiene modelos' })
    }
    if (uniqueIds.length > MAX_BATCH_SIZE) {
      throw createError({ statusCode: 422, statusMessage: `Máximo ${MAX_BATCH_SIZE} modelos por lote` })
    }
    if (uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw createError({ statusCode: 422, statusMessage: 'Los IDs de modelo no son válidos' })
    }

    const itemStatus = input.itemStatus ?? 'DRAFT'
    if (!ALLOWED_ITEM_STATUS.has(itemStatus)) {
      throw createError({ statusCode: 422, statusMessage: 'Estado de item no permitido' })
    }

    const collectionStatus = input.collectionStatus ?? 'DRAFT'
    if (!ALLOWED_COLLECTION_STATUS.has(collectionStatus)) {
      throw createError({ statusCode: 422, statusMessage: 'Estado de colección no permitido' })
    }

    let targetCollectionId = input.collectionId?.trim() || ''
    let targetCollectionSlug = ''
    let createdCollection = false

    if (targetCollectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: targetCollectionId },
        select: { id: true, slug: true },
      })
      if (!collection) throw createError({ statusCode: 404, statusMessage: 'La colección de destino no existe' })
      targetCollectionSlug = collection.slug
    } else {
      const name = input.newCollection?.name?.trim()
      if (!name) {
        throw createError({ statusCode: 422, statusMessage: 'Indica una colección existente o el nombre de una nueva' })
      }
      const collection = await collectionService.create({
        name,
        description: input.newCollection?.description?.trim() || undefined,
        status: collectionStatus as 'DRAFT' | 'PUBLISHED',
      })
      targetCollectionId = collection.id
      targetCollectionSlug = collection.slug
      createdCollection = true
    }

    const maxOrder = await prisma.collectionItem.aggregate({
      where: { collectionId: targetCollectionId },
      _max: { orderIndex: true },
    })
    let nextOrder = (maxOrder._max.orderIndex ?? -1) + 1

    const result: MakerworldBatchResult = {
      collectionId: targetCollectionId,
      collectionSlug: targetCollectionSlug,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      items: [],
    }

    let coverFileId: string | null = null

    for (const modelId of uniqueIds) {
      try {
        const design = await makerworldService.getDesign(modelId)
        const sourceUrl = canonicalModelUrl(modelId)
        const existing = await prisma.collectionItem.findUnique({ where: { sourceUrl } })

        if (existing) {
          if (!input.updateExisting) {
            result.skipped += 1
            result.items.push({
              id: modelId,
              itemId: existing.id,
              action: 'skipped',
              license: design.license,
            })
            continue
          }

          const fileIds = await registerImages(design)
          await prisma.$transaction(async (tx) => {
            await tx.itemFile.deleteMany({ where: { itemId: existing.id } })
            if (fileIds.length) {
              await tx.itemFile.createMany({
                data: fileIds.map((fileId, position) => ({
                  itemId: existing.id,
                  fileId,
                  position,
                  alt: design.title,
                })),
              })
            }
            await tx.collectionItem.update({
              where: { id: existing.id },
              data: {
                name: design.title,
                description: buildImportedDescription(design),
              },
            })
          })

          result.updated += 1
          result.items.push({
            id: modelId,
            itemId: existing.id,
            action: 'updated',
            license: design.license,
          })
          continue
        }

        const fileIds = await registerImages(design)
        const slug = await ensureUniqueItemSlug(slugify(design.slug || design.title))
        const item = await prisma.$transaction(async (tx) => {
          return tx.collectionItem.create({
            data: {
              collectionId: targetCollectionId,
              name: design.title,
              slug,
              sourceUrl,
              description: buildImportedDescription(design),
              status: itemStatus as 'DRAFT' | 'AVAILABLE' | 'ON_DEMAND',
              orderIndex: nextOrder++,
              files: fileIds.length
                ? {
                    create: fileIds.map((fileId, position) => ({
                      fileId,
                      position,
                      alt: design.title,
                    })),
                  }
                : undefined,
            },
          })
        })

        if (createdCollection && input.setCollectionCover !== false && !coverFileId && fileIds[0]) {
          coverFileId = fileIds[0]
        }

        result.created += 1
        result.items.push({
          id: modelId,
          itemId: item.id,
          action: 'created',
          license: design.license,
        })
      } catch (error) {
        const message = errorMessage(error)
        result.errors.push({ id: modelId, message })
        result.items.push({ id: modelId, action: 'error', error: message })
      }
    }

    if (createdCollection && input.setCollectionCover !== false && coverFileId) {
      try {
        await collectionService.update(targetCollectionId, { fileIds: [coverFileId] })
      } catch {
        // La portada es cosmética: no hacemos fallar un lote ya importado.
      }
    }

    return result
  },
}
