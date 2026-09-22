import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { inventoryService } from '~/server/services/inventoryService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

const MOVEMENT = z.enum(['IN', 'OUT', 'ADJUSTMENT', 'SALE'])
const person = z
  .object({ userId: z.string().optional(), name: z.string().optional(), email: z.string().email().optional() })
  .optional()

/** Tools de inventario (Fase 3). */
export function registerInventoryTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'adjust_stock',
    {
      title: 'Registrar movimiento de stock',
      description:
        'Registra un movimiento de inventario sobre un item (IN suma, OUT resta, ADJUSTMENT fija, SALE resta y suma vendidos). Nunca deja stock negativo.',
      inputSchema: {
        itemId: z.string(),
        type: MOVEMENT,
        quantity: z.number().int().min(0),
        reason: z.string().optional(),
        customer: person,
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'adjust_stock', scope: 'inventory:write' }, args, () =>
        inventoryService.create(
          { itemId: args.itemId, type: args.type, quantity: args.quantity, reason: args.reason, customer: args.customer },
          ctx.user,
        )),
  )

  server.registerTool(
    'create_inventory_batch',
    {
      title: 'Registrar lote de inventario',
      description:
        'Registra un lote (varios items) de forma atómica. Cliente obligatorio para OUT/SALE.',
      inputSchema: {
        type: MOVEMENT,
        lines: z.array(z.object({ itemId: z.string(), quantity: z.number().int().positive() })).min(1),
        collectionId: z.string().optional(),
        reason: z.string().optional(),
        customer: person,
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'create_inventory_batch', scope: 'inventory:write' }, args, () =>
        inventoryService.createBatch(
          {
            type: args.type,
            lines: args.lines,
            collectionId: args.collectionId,
            reason: args.reason,
            customer: args.customer,
          },
          ctx.user,
        )),
  )
}
