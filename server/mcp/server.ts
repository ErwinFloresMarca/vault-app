import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpContext } from './types'
import { registerReadTools } from './tools/read'
import { registerCatalogTools } from './tools/catalog'
import { registerInventoryTools } from './tools/inventory'
import { registerPersonalTools } from './tools/personal'
import { registerAdminTools } from './tools/admin'

/**
 * Crea una instancia de McpServer con los tools disponibles según el contexto.
 * El filtrado por scope/rol se aplica por tool (deny-by-default).
 */
export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer({ name: 'volt-vault', version: '0.1.0' })
  registerReadTools(server, ctx)
  registerCatalogTools(server, ctx)
  registerInventoryTools(server, ctx)
  registerPersonalTools(server, ctx)
  registerAdminTools(server, ctx)
  return server
}
