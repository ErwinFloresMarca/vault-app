import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiKeyService } from '~/server/services/apiKeyService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

/** Tools de configuración: gestión de API keys del dueño de la key. */
export function registerKeyTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_api_keys',
    {
      title: 'Listar API keys',
      description: 'Lista las API keys del dueño de la key (sin exponer el hash ni la clave).',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'list_api_keys', scope: 'keys:read' }, args, () =>
        apiKeyService.list(ctx.user.id)),
  )

  server.registerTool(
    'create_api_key',
    {
      title: 'Crear API key',
      description: 'Crea una API key de MCP para el dueño de la key. Se muestra UNA sola vez. Los scopes de administración requieren rol ADMIN.',
      inputSchema: {
        name: z.string().min(1),
        scopes: z.array(z.string()).min(1),
        expiresInDays: z.number().int().positive().optional(),
      },
      annotations: { readOnlyHint: false },
    },
    async (args) =>
      runTool(ctx, { tool: 'create_api_key', scope: 'keys:write' }, args, () =>
        apiKeyService.create(ctx.user.id, ctx.user.role, {
          name: args.name,
          scopes: args.scopes,
          expiresInDays: args.expiresInDays,
        })),
  )

  server.registerTool(
    'revoke_api_key',
    {
      title: 'Revocar API key',
      description: 'Revoca una API key del dueño de la key. Requiere `confirm: true`.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'revoke_api_key', scope: 'keys:write', destructive: true }, args, () =>
        apiKeyService.revoke(ctx.user.id, args.id)),
  )
}
