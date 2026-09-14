import { inventoryService } from '~/server/services/inventoryService'
import { requireAdmin } from '~/server/utils/auth'

const TYPES = ['IN', 'OUT', 'ADJUSTMENT', 'SALE']

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  if (!body?.type || !TYPES.includes(body.type)) {
    throw createError({ statusCode: 422, statusMessage: 'Falta un tipo válido (IN, OUT, ADJUSTMENT, SALE)' })
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'Debes incluir al menos un item (lines)' })
  }

  const lines = body.lines.map((l: { itemId: string; quantity: number }) => ({ itemId: l.itemId, quantity: l.quantity }))

  const batch = await inventoryService.createBatch(
    {
      type: body.type,
      collectionId: typeof body.collectionId === 'string' && body.collectionId !== 'all' ? body.collectionId : undefined,
      reason: typeof body.reason === 'string' && body.reason ? body.reason : undefined,
      lines,
      registeredBy: body.registeredBy ?? undefined,
      customer: body.customer ?? undefined,
    },
    event,
  )

  return { success: true, data: batch }
})
