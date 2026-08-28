import { prisma } from '~/server/utils/db'
import { requireAdmin } from '~/server/utils/auth'
import type { InventoryMovementType } from '@gen-prisma/client'

/**
 * Registra un movimiento de inventario de forma atómica.
 * Actualiza CollectionItem.stock y soldQuantity según el tipo:
 *  - IN:          stock += qty
 *  - OUT:         stock -= qty
 *  - ADJUSTMENT:  stock = qty (ajuste absoluto)
 *  - SALE:        stock -= qty y soldQuantity += qty
 * Valida que el stock resultante nunca quede negativo.
 */
export async function createInventoryMovement(
  input: { itemId: string; type: InventoryMovementType; quantity: number; reason?: string },
  event: any,
) {
  await requireAdmin(event)

  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw createError({ statusCode: 422, statusMessage: 'La cantidad debe ser un entero >= 0' })
  }

  const item = await prisma.collectionItem.findUnique({ where: { id: input.itemId } })
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

  return prisma.$transaction(async (tx) => {
    const current = await tx.collectionItem.findUnique({ where: { id: input.itemId } })
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

    let newStock = current.stock
    let newSold = current.soldQuantity

    switch (input.type) {
      case 'IN':
        newStock += input.quantity
        break
      case 'OUT':
        newStock -= input.quantity
        break
      case 'ADJUSTMENT':
        newStock = input.quantity
        break
      case 'SALE':
        newStock -= input.quantity
        newSold += input.quantity
        break
    }

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

export const inventoryService = {
  create: createInventoryMovement,

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
