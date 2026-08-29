import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import type { InventoryMovementType } from '@gen-prisma/client'

type Px = typeof prisma

/**
 * Calcula el nuevo stock y vendidos para un tipo de movimiento dado.
 *  - IN:          stock += qty
 *  - OUT:         stock -= qty
 *  - ADJUSTMENT:  stock = qty (ajuste absoluto)
 *  - SALE:        stock -= qty y soldQuantity += qty
 */
function applyType(type: InventoryMovementType, quantity: number, currentStock: number, currentSold: number) {
  let newStock = currentStock
  let newSold = currentSold

  switch (type) {
    case 'IN':
      newStock += quantity
      break
    case 'OUT':
      newStock -= quantity
      break
    case 'ADJUSTMENT':
      newStock = quantity
      break
    case 'SALE':
      newStock -= quantity
      newSold += quantity
      break
  }

  return { newStock, newSold }
}

function validateQuantity(quantity: unknown) {
  if (!Number.isInteger(quantity) || (quantity as number) < 0) {
    throw createError({ statusCode: 422, statusMessage: 'La cantidad debe ser un entero >= 0' })
  }
}

/**
 * Registra un movimiento de inventario individual de forma atómica
 * (sin lote). Mantiene compatibilidad con el flujo por item.
 */
export async function createInventoryMovement(
  input: { itemId: string; type: InventoryMovementType; quantity: number; reason?: string },
  event: any,
) {
  await requireAdmin(event)
  validateQuantity(input.quantity)

  const item = await prisma.collectionItem.findUnique({ where: { id: input.itemId } })
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

  return prisma.$transaction(async (tx) => {
    const current = await tx.collectionItem.findUnique({ where: { id: input.itemId } })
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

    const { newStock, newSold } = applyType(input.type, input.quantity, current.stock, current.soldQuantity)

    if (newStock < 0) {
      throw createError({ statusCode: 409, statusMessage: 'Stock insuficiente para esta operación (quedaría negativo)' })
    }

    await tx.inventoryMovement.create({
      data: { itemId: input.itemId, type: input.type, quantity: input.quantity, reason: input.reason },
    })

    return tx.collectionItem.update({
      where: { id: input.itemId },
      data: {
        stock: newStock,
        ...(input.type === 'SALE' ? { soldQuantity: newSold } : {}),
      },
    })
  })
}

/**
 * Registra un lote de movimientos (grupo) de forma atómica.
 * Crea un InventoryBatch (con collectionId opcional) y un InventoryMovement
 * por cada línea, validando que ningún stock quede negativo.
 *
 * input:
 *  - type: tipo del lote (se hereda a cada línea)
 *  - collectionId?: colección asociada (opcional)
 *  - reason?: motivo global
 *  - lines: [{ itemId, quantity }] — uno o más items a afectar
 */
export async function createInventoryBatch(
  input: {
    type: InventoryMovementType
    collectionId?: string
    reason?: string
    lines: { itemId: string; quantity: number }[]
  },
  event: any,
) {
  await requireAdmin(event)

  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'Debes incluir al menos un item' })
  }
  for (const line of input.lines) {
    validateQuantity(line.quantity)
    if (line.quantity === 0) {
      throw createError({ statusCode: 422, statusMessage: 'La cantidad debe ser > 0' })
    }
  }

  if (input.collectionId) {
    const collection = await prisma.collection.findUnique({ where: { id: input.collectionId } })
    if (!collection) throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })
  }

  // Cargar los items y validar que existan
  const itemIds = input.lines.map((l) => l.itemId)
  const items = await prisma.collectionItem.findMany({ where: { id: { in: itemIds } } })
  if (items.length !== itemIds.length) {
    throw createError({ statusCode: 404, statusMessage: 'Uno o más items no existen' })
  }
  const itemMap = new Map(items.map((i) => [i.id, i]))

  return prisma.$transaction(async (tx) => {
    const batch = await tx.inventoryBatch.create({
      data: {
        collectionId: input.collectionId ?? null,
        type: input.type,
        reason: input.reason,
      },
    })

    const results = []
    for (const line of input.lines) {
      const current = itemMap.get(line.itemId)!
      const { newStock, newSold } = applyType(input.type, line.quantity, current.stock, current.soldQuantity)

      if (newStock < 0) {
        throw createError({ statusCode: 409, statusMessage: `${current.name}: stock insuficiente (quedaría negativo)` })
      }

      await tx.inventoryMovement.create({
        data: { itemId: line.itemId, batchId: batch.id, type: input.type, quantity: line.quantity, reason: input.reason },
      })

      const updated = await tx.collectionItem.update({
        where: { id: line.itemId },
        data: {
          stock: newStock,
          ...(input.type === 'SALE' ? { soldQuantity: newSold } : {}),
        },
      })
      results.push(updated)
    }

    return tx.inventoryBatch.update({
      where: { id: batch.id },
      data: {},
      include: {
        collection: { select: { id: true, name: true } },
        movements: {
          include: { item: { select: { id: true, name: true, slug: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
  })
}

/**
 * Lista los lotes (grupos) de movimientos con sus movimientos/items.
 */
export async function listInventoryBatches(query: { collectionId?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))

  const where: any = {}
  if (query.collectionId) where.collectionId = query.collectionId

  const [total, batches] = await Promise.all([
    prisma.inventoryBatch.count({ where }),
    prisma.inventoryBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        collection: { select: { id: true, name: true, slug: true } },
        movements: {
          include: { item: { select: { id: true, name: true, slug: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
  ])

  return { data: batches, total, page, pageSize }
}

export const inventoryService = {
  create: createInventoryMovement,
  createBatch: createInventoryBatch,
  listBatches: listInventoryBatches,

  async list(query: { itemId?: string; type?: string; page?: number; pageSize?: number }) {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))

    const where: any = {}
    if (query.itemId) where.itemId = query.itemId
    if (query.type) where.type = query.type

    const [total, movements] = await Promise.all([
      prisma.inventoryMovement.count({ where }),
      prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { item: { select: { name: true, slug: true } } },
      }),
    ])

    return { data: movements, total, page, pageSize }
  },
}
