import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { userService } from '~/server/services/userService'
import { collectionService } from '~/server/services/collectionService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

/** Tools de la colección personal del dueño de la API key (Fase 3). */
export function registerPersonalTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'collect_item',
    {
      title: 'Marcar item como conseguido',
      description: 'Marca un item como conseguido por el usuario dueño de la API key (idempotente).',
      inputSchema: { itemId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'collect_item', scope: 'personal:write' }, args, () =>
        userService.collect(ctx.user.id, args.itemId)),
  )

  server.registerTool(
    'uncollect_item',
    {
      title: 'Desmarcar item conseguido',
      description: 'Desmarca un item como conseguido (idempotente).',
      inputSchema: { itemId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'uncollect_item', scope: 'personal:write' }, args, () =>
        userService.uncollect(ctx.user.id, args.itemId)),
  )

  server.registerTool(
    'list_my_collection',
    {
      title: 'Mi colección',
      description: 'Lista los items conseguidos por el usuario dueño de la API key.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'list_my_collection', scope: 'personal:read' }, args, () =>
        userService.listCollected(ctx.user.id)),
  )

  server.registerTool(
    'get_my_stats',
    {
      title: 'Mi progreso',
      description: 'Progreso global del usuario (items conseguidos, colecciones completadas).',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'get_my_stats', scope: 'personal:read' }, args, () =>
        collectionService.getUserStats(ctx.user.id)),
  )

  server.registerTool(
    'add_wishlist',
    {
      title: 'Añadir a wishlist',
      description: 'Añade un item a la wishlist del usuario (idempotente).',
      inputSchema: { itemId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'add_wishlist', scope: 'personal:write' }, args, () =>
        userService.addWishlist(ctx.user.id, args.itemId)),
  )

  server.registerTool(
    'remove_wishlist',
    {
      title: 'Quitar de wishlist',
      description: 'Quita un item de la wishlist del usuario (idempotente).',
      inputSchema: { itemId: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'remove_wishlist', scope: 'personal:write' }, args, () =>
        userService.removeWishlist(ctx.user.id, args.itemId)),
  )
}
