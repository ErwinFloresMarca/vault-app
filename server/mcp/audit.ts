import { prisma } from '~/server/utils/db'
import type { McpContext } from './types'

const SENSITIVE = /key|token|secret|password|authorization/i

/** Redacta valores sensibles antes de persistir los argumentos. */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value == null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.test(k) ? '[redacted]' : redact(v, depth + 1)
  }
  return out
}

/** Registra una invocación de tool (best-effort; no rompe la respuesta). */
export async function auditMcp(params: {
  ctx: McpContext
  tool: string
  args: unknown
  result: 'ok' | 'error'
  statusCode?: number
  error?: string
  durationMs: number
}): Promise<void> {
  try {
    await prisma.mcpAuditLog.create({
      data: {
        apiKeyId: params.ctx.apiKeyId,
        userId: params.ctx.user.id,
        tool: params.tool,
        args: redact(params.args) as object,
        result: params.result,
        statusCode: params.statusCode,
        error: params.error?.slice(0, 500),
        ip: params.ctx.ip,
        userAgent: params.ctx.userAgent,
        durationMs: params.durationMs,
      },
    })
  } catch {
    // la auditoría nunca debe tumbar la petición
  }
}
