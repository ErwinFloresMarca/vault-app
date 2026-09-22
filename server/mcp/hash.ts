import { createHash, randomBytes } from 'node:crypto'

/**
 * Hash de API keys del MCP. Se usa un "pepper" del entorno para que un volcado
 * de la BD no permita reusar hashes.
 * Prioridad: MCP_KEY_PEPPER → NUXT_SESSION_PASSWORD.
 */
export function hashApiKey(key: string): string {
  const pepper = process.env.MCP_KEY_PEPPER || process.env.NUXT_SESSION_PASSWORD || ''
  return createHash('sha256').update(`${pepper}:${key}`).digest('hex')
}

/** Genera una API key nueva (solo se muestra una vez). */
export function generateApiKey(): string {
  return `vvk_${randomBytes(24).toString('base64url')}`
}
