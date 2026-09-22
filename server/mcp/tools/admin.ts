import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { userService } from '~/server/services/userService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

/** Tools de administración (Fase 3). Requieren scope admin + rol ADMIN. */
export function registerAdminTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_users',
    {
      title: 'Listar usuarios',
      description: 'Lista usuarios (filtro por rol/búsqueda). Requiere ADMIN.',
      inputSchema: { role: z.enum(['USER', 'ADMIN']).optional(), search: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'list_users', scope: 'users:read' }, args, () =>
        userService.listUsers({ role: args.role, search: args.search })),
  )

  server.registerTool(
    'set_user_role',
    {
      title: 'Cambiar rol de usuario',
      description: 'Cambia el rol de un usuario (USER/ADMIN). Requiere ADMIN y `confirm: true`.',
      inputSchema: { userId: z.string(), role: z.enum(['USER', 'ADMIN']), confirm: z.boolean().optional() },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'set_user_role', scope: 'users:write', destructive: true }, args, () =>
        userService.setRole(args.userId, args.role)),
  )
}
