import { MCP_SCOPES, ADMIN_MCP_SCOPES, type McpScope } from '~/types'

// Reexporta la lista compartida de scopes (fuente única en `types/index.ts`).
export { MCP_SCOPES, ADMIN_MCP_SCOPES }
export type { McpScope }

/** Scopes que exigen rol ADMIN. */
export const ADMIN_SCOPES: McpScope[] = ADMIN_MCP_SCOPES

export interface McpContext {
  apiKeyId: string
  user: { id: string; email: string; name: string; role: 'USER' | 'ADMIN' }
  scopes: McpScope[]
  ip?: string
  userAgent?: string
}
