import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { auditMcp } from './audit'
import { checkRateLimit } from './rateLimit'
import type { McpContext, McpScope } from './types'

export function textResult(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  }
}

export function errorResult(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text' as const, text: message }] }
}

/**
 * Ejecuta la lógica de un tool aplicando: scope (403), rate limit (429),
 * ejecución y auditoría. Los errores se devuelven como resultado MCP (no tumban
 * el transporte). No es genérico a propósito: los tipos condicionales del SDK
 * no resuelven con genéricos.
 */
export async function runTool(
  ctx: McpContext,
  meta: { tool: string; scope: McpScope },
  args: unknown,
  fn: () => Promise<unknown>,
): Promise<CallToolResult> {
  const started = Date.now()
  try {
    if (!ctx.scopes.includes(meta.scope)) {
      throw createError({ statusCode: 403, statusMessage: `Scope requerido: ${meta.scope}` })
    }
    const rl = checkRateLimit(ctx.apiKeyId)
    if (!rl.ok) {
      throw createError({ statusCode: 429, statusMessage: `Rate limit excedido; reintenta en ${rl.retryAfter}s` })
    }
    const result = await fn()
    await auditMcp({ ctx, tool: meta.tool, args, result: 'ok', durationMs: Date.now() - started })
    return textResult(result)
  } catch (e) {
    const err = e as { statusCode?: number; statusMessage?: string; message?: string }
    const status = err.statusCode ?? 500
    await auditMcp({
      ctx,
      tool: meta.tool,
      args,
      result: 'error',
      statusCode: status,
      error: err.statusMessage ?? err.message,
      durationMs: Date.now() - started,
    })
    return errorResult(`${meta.tool} falló (${status}): ${err.statusMessage ?? err.message ?? 'error'}`)
  }
}
