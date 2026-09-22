export const MCP_SCOPES = [
  'catalog:read',
  'catalog:write',
  'files:write',
  'inventory:read',
  'inventory:write',
  'personal:read',
  'personal:write',
  'stats:read',
  'users:read',
  'users:write',
] as const

export type McpScope = (typeof MCP_SCOPES)[number]

/** Scopes que exigen rol ADMIN. */
export const ADMIN_SCOPES: McpScope[] = ['stats:read', 'users:read', 'users:write']

export interface McpContext {
  apiKeyId: string
  user: { id: string; email: string; name: string; role: 'USER' | 'ADMIN' }
  scopes: McpScope[]
  ip?: string
  userAgent?: string
}
