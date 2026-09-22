import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { collectionService } from '~/server/services/collectionService'
import { itemService } from '~/server/services/itemService'
import { statsService } from '~/server/services/statsService'
import { auditMcp } from './audit'
import type { McpContext, McpScope } from './types'

function json(uri: URL, data: unknown) {
  return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] }
}

/** Ejecuta la lectura de un recurso con scope + auditoría. */
async function guardedRead(
  ctx: McpContext,
  scope: McpScope,
  name: string,
  uri: URL,
  fn: () => Promise<unknown>,
) {
  const started = Date.now()
  try {
    if (!ctx.scopes.includes(scope)) {
      throw createError({ statusCode: 403, statusMessage: `Scope requerido: ${scope}` })
    }
    const data = await fn()
    await auditMcp({ ctx, tool: `resource:${name}`, args: { uri: uri.href }, result: 'ok', durationMs: Date.now() - started })
    return json(uri, data)
  } catch (e) {
    const err = e as { statusCode?: number; statusMessage?: string; message?: string }
    await auditMcp({
      ctx,
      tool: `resource:${name}`,
      args: { uri: uri.href },
      result: 'error',
      statusCode: err.statusCode ?? 500,
      error: err.statusMessage ?? err.message,
      durationMs: Date.now() - started,
    })
    throw e
  }
}

/** Recursos de solo lectura (Fase 4). */
export function registerResources(server: McpServer, ctx: McpContext) {
  server.registerResource(
    'collections',
    'voltvault://collections',
    { title: 'Colecciones', description: 'Listado de colecciones publicadas.', mimeType: 'application/json' },
    (uri) => guardedRead(ctx, 'catalog:read', 'collections', uri, () => collectionService.listPublic({}, ctx.user.id)),
  )

  server.registerResource(
    'collection',
    new ResourceTemplate('voltvault://collections/{slug}', { list: undefined }),
    { title: 'Colección', description: 'Detalle de una colección por slug.', mimeType: 'application/json' },
    (uri, variables) =>
      guardedRead(ctx, 'catalog:read', 'collection', uri, () =>
        collectionService.getBySlug(String(variables.slug), ctx.user.id)),
  )

  server.registerResource(
    'item',
    new ResourceTemplate('voltvault://items/{slug}', { list: undefined }),
    { title: 'Item', description: 'Detalle de un item por slug.', mimeType: 'application/json' },
    (uri, variables) =>
      guardedRead(ctx, 'catalog:read', 'item', uri, () => itemService.getBySlug(String(variables.slug), ctx.user.id)),
  )

  server.registerResource(
    'my-stats',
    'voltvault://me/stats',
    { title: 'Mi progreso', description: 'Progreso global del usuario.', mimeType: 'application/json' },
    (uri) => guardedRead(ctx, 'personal:read', 'me/stats', uri, () => collectionService.getUserStats(ctx.user.id)),
  )

  server.registerResource(
    'admin-stats',
    'voltvault://admin/stats',
    { title: 'Métricas', description: 'Métricas del dashboard (admin).', mimeType: 'application/json' },
    (uri) => guardedRead(ctx, 'stats:read', 'admin/stats', uri, () => statsService.getAdminStats()),
  )
}
