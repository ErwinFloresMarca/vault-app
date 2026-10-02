import { prisma } from '~/server/utils/db'
import { generateApiKey, hashApiKey } from '~/server/mcp/hash'
import { MCP_SCOPES, ADMIN_MCP_SCOPES } from '~/types'
import type { McpScope, ApiKeyDto } from '~/types'

type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  scopes: string[]
  lastUsedAt: Date | null
  expiresAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

function toDto(row: ApiKeyRow): ApiKeyDto {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: row.scopes as McpScope[],
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

/** Gestión de API keys de MCP por usuario (nunca expone el hash). */
export const apiKeyService = {
  async list(userId: string): Promise<ApiKeyDto[]> {
    const keys = await prisma.apiKey.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
    return keys.map(toDto)
  },

  async create(
    userId: string,
    role: 'USER' | 'ADMIN',
    input: { name: string; scopes: string[]; expiresInDays?: number },
  ): Promise<{ apiKey: ApiKeyDto; key: string }> {
    const name = input.name?.trim()
    if (!name) throw createError({ statusCode: 422, statusMessage: 'El nombre es obligatorio' })

    const scopes = [...new Set(input.scopes ?? [])]
    if (!scopes.length) throw createError({ statusCode: 422, statusMessage: 'Selecciona al menos un scope' })

    const invalid = scopes.filter((s) => !MCP_SCOPES.includes(s as McpScope))
    if (invalid.length) {
      throw createError({ statusCode: 422, statusMessage: `Scopes inválidos: ${invalid.join(', ')}` })
    }
    if (role !== 'ADMIN' && scopes.some((s) => ADMIN_MCP_SCOPES.includes(s as McpScope))) {
      throw createError({ statusCode: 403, statusMessage: 'Los scopes de administración requieren rol ADMIN' })
    }

    const key = generateApiKey()
    const keyHash = hashApiKey(key)
    const prefix = key.slice(0, 8)
    const expiresAt = input.expiresInDays && input.expiresInDays > 0
      ? new Date(Date.now() + input.expiresInDays * 86_400_000)
      : null

    const row = await prisma.apiKey.create({
      data: { name, keyHash, prefix, userId, scopes, expiresAt },
    })
    return { apiKey: toDto(row), key }
  },

  async revoke(userId: string, id: string): Promise<ApiKeyDto> {
    const existing = await prisma.apiKey.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      throw createError({ statusCode: 404, statusMessage: 'API key no encontrada' })
    }
    if (existing.revokedAt) return toDto(existing)
    const row = await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } })
    return toDto(row)
  },
}
