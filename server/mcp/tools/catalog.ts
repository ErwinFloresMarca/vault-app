import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { collectionService } from '~/server/services/collectionService'
import { itemService } from '~/server/services/itemService'
import { fileService } from '~/server/services/fileService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

const STATUS = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
const RARITY = z.enum(['COMMON', 'RARE', 'EPIC', 'LEGENDARY'])
const ITEM_STATUS = z.enum(['DRAFT', 'AVAILABLE', 'SOLD_OUT', 'ARCHIVED'])

async function resolveTagIds(names?: string[]): Promise<string[] | undefined> {
  if (!names?.length) return undefined
  const tags = await Promise.all(names.map((name) => collectionService.upsertTagByName(name)))
  return tags.map((t) => t.id)
}

/** Tools de ESCRITURA de catálogo (Fase 2). */
export function registerCatalogTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'create_collection',
    {
      title: 'Crear colección',
      description: 'Crea una colección. `tags` se interpretan como nombres (se crean si no existen).',
      inputSchema: {
        name: z.string().min(1),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        fileIds: z.array(z.string()).optional(),
        status: STATUS.optional(),
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'create_collection', scope: 'catalog:write' }, args, async () =>
        collectionService.create({
          name: args.name,
          description: args.description,
          tags: await resolveTagIds(args.tags),
          fileIds: args.fileIds,
          status: args.status,
        })),
  )

  server.registerTool(
    'update_collection',
    {
      title: 'Actualizar colección',
      description: 'Actualiza una colección por id (name/description/tags/fileIds/status).',
      inputSchema: {
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        fileIds: z.array(z.string()).optional(),
        status: STATUS.optional(),
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'update_collection', scope: 'catalog:write' }, args, async () =>
        collectionService.update(args.id, {
          name: args.name,
          description: args.description,
          tags: await resolveTagIds(args.tags),
          fileIds: args.fileIds,
          status: args.status,
        })),
  )

  server.registerTool(
    'publish_collection',
    {
      title: 'Publicar colección',
      description: 'Marca una colección como PUBLISHED.',
      inputSchema: { id: z.string() },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'publish_collection', scope: 'catalog:write' }, args, () =>
        collectionService.update(args.id, { status: 'PUBLISHED' })),
  )

  server.registerTool(
    'archive_collection',
    {
      title: 'Archivar colección',
      description: 'Archiva (soft delete) una colección. Requiere `confirm: true`.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'archive_collection', scope: 'catalog:write', destructive: true }, args, () =>
        collectionService.remove(args.id)),
  )

  server.registerTool(
    'upsert_tag',
    {
      title: 'Crear/actualizar etiqueta',
      description: 'Crea o actualiza una etiqueta por nombre.',
      inputSchema: { name: z.string().min(1) },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'upsert_tag', scope: 'catalog:write' }, args, () =>
        collectionService.upsertTagByName(args.name)),
  )

  server.registerTool(
    'create_item',
    {
      title: 'Crear item',
      description: 'Crea un item en una colección (stock inicial opcional genera un movimiento IN).',
      inputSchema: {
        name: z.string().min(1),
        collectionId: z.string(),
        description: z.string().optional(),
        fileIds: z.array(z.string()).optional(),
        stockInicial: z.number().int().min(0).optional(),
        status: ITEM_STATUS.optional(),
        rarity: RARITY.optional(),
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'create_item', scope: 'catalog:write' }, args, () =>
        itemService.create({
          name: args.name,
          collectionId: args.collectionId,
          description: args.description,
          fileIds: args.fileIds,
          stockInicial: args.stockInicial,
          status: args.status,
          rarity: args.rarity,
        })),
  )

  server.registerTool(
    'update_item',
    {
      title: 'Actualizar item',
      description: 'Actualiza un item por id (name/description/fileIds/status/rarity). No cambia stock.',
      inputSchema: {
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        fileIds: z.array(z.string()).optional(),
        status: ITEM_STATUS.optional(),
        rarity: RARITY.optional(),
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'update_item', scope: 'catalog:write' }, args, () =>
        itemService.update(args.id, {
          name: args.name,
          description: args.description,
          fileIds: args.fileIds,
          status: args.status,
          rarity: args.rarity,
        })),
  )

  server.registerTool(
    'set_item_rarity',
    {
      title: 'Cambiar rareza',
      description: 'Cambia la rareza de un item.',
      inputSchema: { id: z.string(), rarity: RARITY },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'set_item_rarity', scope: 'catalog:write' }, args, () =>
        itemService.update(args.id, { rarity: args.rarity })),
  )

  server.registerTool(
    'archive_item',
    {
      title: 'Archivar item',
      description: 'Archiva (soft delete) un item. Requiere `confirm: true`.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'archive_item', scope: 'catalog:write', destructive: true }, args, () =>
        itemService.remove(args.id)),
  )

  server.registerTool(
    'register_file_url',
    {
      title: 'Registrar archivo por URL',
      description: 'Registra una URL como archivo. Solo `/uploads/…` o `https://images.unsplash.com`.',
      inputSchema: { url: z.string().url().or(z.string().startsWith('/uploads/')), mimeType: z.string().optional() },
      annotations: { readOnlyHint: false, idempotentHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'register_file_url', scope: 'files:write' }, args, () =>
        fileService.registerUrl({ url: args.url, mimeType: args.mimeType })),
  )
}
