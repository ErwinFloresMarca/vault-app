import type { H3Event } from 'h3'
import { prisma } from '~/server/utils/db'
import { hashApiKey } from './hash'
import { ADMIN_SCOPES, type McpContext, type McpScope } from './types'

/**
 * Autentica una petición MCP por API key (Bearer). Deny-by-default.
 * Lanza 401 si falta/ inválida/ expirada/ revocada; 403 si el scope exige ADMIN
 * y el usuario no lo es.
 */
export async function authenticateMcp(event: H3Event): Promise<McpContext> {
  const header = getHeader(event, 'authorization')?.trim() ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Falta Authorization: Bearer <api key>' })
  }

  const keyHash = hashApiKey(match[1]!.trim())
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash }, include: { user: true } })
  if (!apiKey) throw createError({ statusCode: 401, statusMessage: 'API key inválida' })
  if (apiKey.revokedAt) throw createError({ statusCode: 401, statusMessage: 'API key revocada' })
  if (apiKey.expiresAt && apiKey.expiresAt.getTime() < Date.now()) {
    throw createError({ statusCode: 401, statusMessage: 'API key expirada' })
  }

  const scopes = apiKey.scopes as McpScope[]
  if (apiKey.user.role !== 'ADMIN' && scopes.some((scope) => ADMIN_SCOPES.includes(scope))) {
    throw createError({ statusCode: 403, statusMessage: 'Los scopes de administración requieren rol ADMIN' })
  }

  // best-effort: registrar último uso
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  return {
    apiKeyId: apiKey.id,
    user: {
      id: apiKey.user.id,
      email: apiKey.user.email,
      name: apiKey.user.name,
      role: apiKey.user.role,
    },
    scopes,
    ip: getRequestIP(event, { xForwardedFor: true }) ?? undefined,
    userAgent: getHeader(event, 'user-agent') ?? undefined,
  }
}
