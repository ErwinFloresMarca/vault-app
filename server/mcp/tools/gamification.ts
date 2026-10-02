import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { gamificationService } from '~/server/services/gamificationService'
import { runTool } from '../tool'
import type { McpContext } from '../types'

/** Tools de gamificación (insignias y XP). */
export function registerGamificationTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'get_my_achievements',
    {
      title: 'Mis insignias',
      description: 'Insignias del dueño de la key (desbloqueadas y pendientes).',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'get_my_achievements', scope: 'personal:read' }, args, () =>
        gamificationService.getAchievements(ctx.user.id)),
  )

  server.registerTool(
    'list_achievements',
    {
      title: 'Listar insignias',
      description: 'Todas las insignias (definiciones) y, si se indica userId, su estado para ese usuario. Requiere ADMIN.',
      inputSchema: { userId: z.string().optional() },
      annotations: { readOnlyHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'list_achievements', scope: 'users:read' }, args, () =>
        gamificationService.getAchievements(args.userId)),
  )

  server.registerTool(
    'recompute_gamification',
    {
      title: 'Recalcular XP/insignias',
      description: 'Recalcula XP e insignias de un usuario (idempotente). Requiere ADMIN y `confirm: true`.',
      inputSchema: { userId: z.string(), confirm: z.boolean().optional() },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async (args) =>
      runTool(ctx, { tool: 'recompute_gamification', scope: 'users:write', destructive: true }, args, () =>
        gamificationService.recompute(args.userId)),
  )
}
