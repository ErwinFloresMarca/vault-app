import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { collectionService } from '~/server/services/collectionService'
import { itemService } from '~/server/services/itemService'
import { fileService } from '~/server/services/fileService'
import { inventoryService } from '~/server/services/inventoryService'
import { statsService } from '~/server/services/statsService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

const READ_ONLY = { readOnlyHint: true }

/** Tools de SOLO LECTURA (Fase 1). */
export function registerReadTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_collections',
    {
      title: 'Listar colecciones',
      description: 'Lista colecciones del catálogo (por defecto solo publicadas). Filtros opcionales.',
      inputSchema: {
        tag: z.string().optional().describe('Slug de etiqueta'),
        q: z.string().optional().describe('Búsqueda por nombre/descripción'),
        sort: z.enum(['featured', 'name', 'recent']).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(48).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'list_collections', scope: 'catalog:read' }, args, () =>
        collectionService.listPublic(args, ctx.user.id)),
  )

  server.registerTool(
    'get_collection',
    {
      title: 'Obtener colección',
      description: 'Obtiene una colección por slug (con items y progreso del usuario).',
      inputSchema: { slug: z.string().describe('Slug de la colección') },
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'get_collection', scope: 'catalog:read' }, args, async () => {
        const collection = await collectionService.getBySlug(args.slug, ctx.user.id)
        if (!collection) throw createError({ statusCode: 404, statusMessage: 'Colección no encontrada' })
        return collection
      }),
  )

  server.registerTool(
    'list_tags',
    {
      title: 'Listar etiquetas',
      description: 'Lista todas las etiquetas del catálogo.',
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'list_tags', scope: 'catalog:read' }, args, async () => ({
        data: await collectionService.listTags(),
      })),
  )

  server.registerTool(
    'list_items',
    {
      title: 'Listar items',
      description: 'Lista items del catálogo con filtros opcionales (colección, estado, rareza).',
      inputSchema: {
        collectionId: z.string().optional(),
        status: z.enum(['DRAFT', 'AVAILABLE', 'ON_DEMAND', 'SOLD_OUT', 'ARCHIVED']).optional(),
        rarity: z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY']).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) => runTool(ctx, { tool: 'list_items', scope: 'catalog:read' }, args, () => itemService.list(args)),
  )

  server.registerTool(
    'get_item',
    {
      title: 'Obtener item',
      description: 'Obtiene un item por slug (galería, stock, rareza, estado).',
      inputSchema: { slug: z.string() },
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'get_item', scope: 'catalog:read' }, args, async () => {
        const item = await itemService.getBySlug(args.slug, ctx.user.id)
        if (!item) throw createError({ statusCode: 404, statusMessage: 'Item no encontrado' })
        return item
      }),
  )

  server.registerTool(
    'list_files',
    {
      title: 'Listar archivos',
      description: 'Lista archivos (imágenes) registrados.',
      inputSchema: {
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) => runTool(ctx, { tool: 'list_files', scope: 'catalog:read' }, args, () =>
      fileService.list(args.page, args.pageSize)),
  )

  server.registerTool(
    'list_inventory_movements',
    {
      title: 'Listar movimientos de inventario',
      description: 'Lista movimientos de inventario (filtro por item/tipo, paginado).',
      inputSchema: {
        itemId: z.string().optional(),
        type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'SALE']).optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'list_inventory_movements', scope: 'inventory:read' }, args, () => inventoryService.list(args)),
  )

  server.registerTool(
    'list_inventory_batches',
    {
      title: 'Listar lotes de inventario',
      description: 'Lista lotes (batches) de inventario con sus movimientos.',
      inputSchema: {
        collectionId: z.string().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'list_inventory_batches', scope: 'inventory:read' }, args, () =>
        inventoryService.listBatches(args)),
  )

  server.registerTool(
    'get_admin_stats',
    {
      title: 'Métricas de admin',
      description: 'Métricas del dashboard (conteos, ventas, top items, actividad reciente). Requiere ADMIN.',
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'get_admin_stats', scope: 'stats:read' }, args, async () => ({
        data: await statsService.getAdminStats(),
      })),
  )

  server.registerTool(
    'get_public_stats',
    {
      title: 'Métricas públicas',
      description: 'Conteos públicos de la vitrina (colecciones, items, insignias legendarias, coleccionistas, piezas conseguidas).',
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async (args) =>
      runTool(ctx, { tool: 'get_public_stats', scope: 'catalog:read' }, args, () =>
        statsService.getPublicStats()),
  )
}
