import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { authenticateMcp } from '~/server/mcp/auth'
import { createMcpServer } from '~/server/mcp/server'

/**
 * Endpoint MCP (Model Context Protocol) — Streamable HTTP, JSON-RPC 2.0.
 * Stateless: cada POST crea un server+transport efímero. Requiere
 * `Authorization: Bearer <api key>` (ver `docs/specs/m12-mcp-server.md`).
 */
export default defineEventHandler(async (event) => {
  const ctx = await authenticateMcp(event)

  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    setHeader(event, 'Allow', 'POST')
    return { jsonrpc: '2.0', error: { code: -32000, message: 'Método no permitido (usa POST)' }, id: null }
  }

  const raw = await readRawBody(event, 'utf8')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Cuerpo JSON-RPC requerido' })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'JSON inválido' })
  }

  const server = createMcpServer(ctx)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // modo stateless
    enableJsonResponse: true,
  })
  await server.connect(transport)
  await transport.handleRequest(event.node.req, event.node.res, body)

  // El transporte ya escribió la respuesta en el socket: evitamos que h3/Nitro
  // intente enviar otra. `handled` es readonly en los tipos, pero es la señal
  // que usa h3 para omitir la serialización de la respuesta.
  ;(event as unknown as { handled: boolean }).handled = true
  return undefined
})
