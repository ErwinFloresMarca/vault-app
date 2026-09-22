import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { collectionService } from '~/server/services/collectionService'
import { itemService } from '~/server/services/itemService'
import { inventoryService } from '~/server/services/inventoryService'
import type { McpContext, McpScope } from './types'

function userMessage(text: string) {
  return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] }
}

function requireScope(ctx: McpContext, scope: McpScope) {
  if (!ctx.scopes.includes(scope)) {
    throw createError({ statusCode: 403, statusMessage: `Scope requerido: ${scope}` })
  }
}

/** Prompts reutilizables (Fase 4). */
export function registerPrompts(server: McpServer, ctx: McpContext) {
  server.registerPrompt(
    'describe_collection',
    {
      title: 'Describir colección',
      description: 'Genera copy atractivo para una colección a partir de sus datos reales.',
      argsSchema: { slug: z.string().describe('Slug de la colección') },
    },
    async ({ slug }) => {
      requireScope(ctx, 'catalog:read')
      const collection = await collectionService.getBySlug(slug, ctx.user.id)
      if (!collection) throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })
      const names = collection.items.map((i) => i.name).join(', ')
      return userMessage(
        `Escribe una descripción de catálogo (2-3 frases, tono coleccionista, español) para la colección "${collection.name}".\n` +
          `Etiquetas: ${collection.tags.map((t) => t.name).join(', ') || 'ninguna'}.\n` +
          `Items (${collection.items.length}): ${names || 'sin items'}.\n` +
          `No inventes materiales ni precios que no aparezcan en los datos.`,
      )
    },
  )

  server.registerPrompt(
    'suggest_item_description',
    {
      title: 'Sugerir descripción de item',
      description: 'Propone una descripción corta para un item nuevo.',
      argsSchema: {
        name: z.string().describe('Nombre del item'),
        collectionSlug: z.string().optional(),
      },
    },
    async ({ name, collectionSlug }) =>
      userMessage(
        `Propón una descripción breve (1-2 frases, español, tono coleccionista) para un coleccionable impreso en 3D llamado "${name}"` +
          (collectionSlug ? ` dentro de la colección "${collectionSlug}"` : '') +
          `. Incluye un dato útil para el comprador y evita exageraciones.`,
      ),
  )

  server.registerPrompt(
    'summarize_inventory',
    {
      title: 'Resumir inventario de un item',
      description: 'Resume el estado de stock y los últimos movimientos de un item.',
      argsSchema: { slug: z.string().describe('Slug del item') },
    },
    async ({ slug }) => {
      requireScope(ctx, 'inventory:read')
      const item = await itemService.getBySlug(slug, ctx.user.id)
      if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
      const movements = await inventoryService.list({ itemId: item.id, pageSize: 20 })
      const lines = movements.data
        .map((m) => `- ${m.type} ${m.quantity}${m.reason ? ` (${m.reason})` : ''}`)
        .join('\n')
      return userMessage(
        `Resume en 2-4 frases el estado de inventario del item "${item.name}".\n` +
          `Stock actual: ${item.stock}. Vendidos: ${item.soldQuantity}.\nMovimientos recientes:\n${lines || '- sin movimientos'}`,
      )
    },
  )
}
