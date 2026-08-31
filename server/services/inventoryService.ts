import { prisma } from '~/server/utils/db'
import { requireAdmin, getCurrentUser } from '~/server/utils/auth'
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

export interface PersonInput {
  userId?: string
  name?: string
  email?: string
}

interface ResolvedPerson {
  userId: string | null
  name: string | null
  email: string | null
}

/**
 * Resuelve los datos de la persona que registra (registeredBy) a partir del
 * input y del usuario de sesión. Siempre debe quedar un nombre o un userId.
 */
function resolveRegisteredBy(input: { registeredBy?: PersonInput }, sessionUser: { id: string; name: string; email: string } | null): ResolvedPerson {
  return {
    userId: input.registeredBy?.userId || sessionUser?.id || null,
    name: input.registeredBy?.name || sessionUser?.name || null,
    email: input.registeredBy?.email || sessionUser?.email || null,
  }
}

/**
 * Valida y resuelve la persona a quien se vende/entrega (customer).
 * Solo es obligatoria para OUT y SALE.
 */
function resolveCustomer(type: InventoryMovementType, input: { customer?: PersonInput }): ResolvedPerson {
  const customer = input.customer
  const name = customer?.name?.trim() || null
  const email = customer?.email?.trim() || null
  const userId = customer?.userId || null

  if (type === 'OUT' || type === 'SALE') {
    if (!name && !userId) {
      throw createError({ statusCode: 422, statusMessage: 'Para ventas/salidas es obligatorio indicar la persona (nombre o usuario)' })
    }
  }

  return { userId, name, email }
}

/**
 * Expande los datos de persona a las claves físicas con prefijo que esperan
 * los modelos InventoryBatch / InventoryMovement de Prisma.
 */
function personFields(registeredBy: ResolvedPerson, customer: ResolvedPerson) {
  return {
    registeredByUserId: registeredBy.userId,
    registeredByName: registeredBy.name,
    registeredByEmail: registeredBy.email,
    customerUserId: customer.userId,
    customerName: customer.name,
    customerEmail: customer.email,
  }
}

/**
 * Registra un movimiento de inventario individual. Aunque es "individual", crea
 * un InventoryBatch con la colección del item por defecto (para mantener la
 * trazabilidad por persona de forma unificada), con un solo InventoryMovement.
 */
export async function createInventoryMovement(
  input: {
    itemId: string
    type: InventoryMovementType
    quantity: number
    reason?: string
    registeredBy?: PersonInput
    customer?: PersonInput
  },
  event: any,
) {
  const user = await requireAdmin(event)
  validateQuantity(input.quantity)

  const item = await prisma.collectionItem.findUnique({ where: { id: input.itemId } })
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

  const registeredBy = resolveRegisteredBy(input, user)
  const customer = resolveCustomer(input.type, input)

  return prisma.$transaction(async (tx) => {
    const current = await tx.collectionItem.findUnique({ where: { id: input.itemId } })
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })

    const { newStock, newSold } = applyType(input.type, input.quantity, current.stock, current.soldQuantity)

    if (newStock < 0) {
      throw createError({ statusCode: 409, statusMessage: 'Stock insuficiente para esta operación (quedaría negativo)' })
    }

    const batch = await tx.inventoryBatch.create({
      data: {
        collectionId: item.collectionId,
        type: input.type,
        reason: input.reason,
        ...personFields(registeredBy, customer),
      },
    })

    const movement = await tx.inventoryMovement.create({
      data: {
        itemId: input.itemId,
        batchId: batch.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
        ...personFields(registeredBy, customer),
      },
    })

    await tx.collectionItem.update({
      where: { id: input.itemId },
      data: {
        stock: newStock,
        ...(input.type === 'SALE' ? { soldQuantity: newSold } : {}),
      },
    })

    return tx.inventoryBatch.findUnique({
      where: { id: batch.id },
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
 * Registra un lote de movimientos (grupo) de forma atómica.
 * Crea un InventoryBatch (con collectionId opcional) y un InventoryMovement
 * por cada línea, validando que ningún stock quede negativo.
 *
 * input:
 *  - type: tipo del lote (se hereda a cada línea)
 *  - collectionId?: colección asociada (opcional; null = global)
 *  - reason?: motivo global
 *  - lines: [{ itemId, quantity }] — uno o más items a afectar
 *  - registeredBy?: persona que registra
 *  - customer?: persona a quien se vende/entrega (obligatoria en OUT/SALE)
 */
export async function createInventoryBatch(
  input: {
    type: InventoryMovementType
    collectionId?: string
    reason?: string
    lines: { itemId: string; quantity: number }[]
    registeredBy?: PersonInput
    customer?: PersonInput
  },
  event: any,
) {
  const user = await requireAdmin(event)

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

  const registeredBy = resolveRegisteredBy(input, user)
  const customer = resolveCustomer(input.type, input)

  // collectionId auto: si no se especifica, se deriva de los items —
  // una sola colección común → esa; varias (o ninguna) → global (null)
  if (!input.collectionId) {
    const unique = new Set(items.map((i) => i.collectionId).filter(Boolean))
    input.collectionId = unique.size === 1 ? [...unique][0] as string : undefined
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.inventoryBatch.create({
      data: {
        collectionId: input.collectionId ?? null,
        type: input.type,
        reason: input.reason,
        ...personFields(registeredBy, customer),
      },
    })

    for (const line of input.lines) {
      const current = itemMap.get(line.itemId)!
      const { newStock, newSold } = applyType(input.type, line.quantity, current.stock, current.soldQuantity)

      if (newStock < 0) {
        throw createError({ statusCode: 409, statusMessage: `${current.name}: stock insuficiente (quedaría negativo)` })
      }

      await tx.inventoryMovement.create({
        data: {
          itemId: line.itemId,
          batchId: batch.id,
          type: input.type,
          quantity: line.quantity,
          reason: input.reason,
          ...personFields(registeredBy, customer),
        },
      })

      await tx.collectionItem.update({
        where: { id: line.itemId },
        data: {
          stock: newStock,
          ...(input.type === 'SALE' ? { soldQuantity: newSold } : {}),
        },
      })
    }

    return tx.inventoryBatch.findUnique({
      where: { id: batch.id },
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

const batchInclude = {
  collection: { select: { id: true, name: true, slug: true } },
  registeredBy: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, email: true } },
  movements: {
    include: {
      item: { select: { id: true, name: true, slug: true, collectionId: true } },
      registeredBy: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
}

/**
 * Lista los lotes (grupos) de movimientos con sus movimientos/items/personas.
 */
export async function listInventoryBatches(query: { collectionId?: string; page?: number; pageSize?: number; all?: boolean }) {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))

  const where: any = {}
  // all=true (o global) lista batches sin filtrar por colección.
  if (query.collectionId && query.collectionId !== 'all') where.collectionId = query.collectionId

  const [total, batches] = await Promise.all([
    prisma.inventoryBatch.count({ where }),
    prisma.inventoryBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: batchInclude as any,
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
        include: {
          item: { select: { name: true, slug: true } },
          registeredBy: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, email: true } },
        },
      }),
    ])

    return { data: movements, total, page, pageSize }
  },
}
