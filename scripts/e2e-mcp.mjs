import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const URL_MCP = process.env.MCP_URL || 'http://localhost:3000/mcp'
const KEY = process.env.MCP_KEY
if (!KEY) {
  console.error('Falta MCP_KEY (crea una con: pnpm mcp:key --scopes catalog:read)')
  process.exit(1)
}

const results = []
const check = (name, ok) => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`)
}

const transport = new StreamableHTTPClientTransport(new URL(URL_MCP), {
  requestInit: { headers: { Authorization: `Bearer ${KEY}` } },
})
const client = new Client({ name: 'vault-mcp-smoke', version: '0.1.0' })

try {
  await client.connect(transport)

  const { tools } = await client.listTools()
  check(`listTools (${tools.length})`, tools.length > 0)
  check('incluye list_collections', tools.some((t) => t.name === 'list_collections'))

  const collections = await client.callTool({ name: 'list_collections', arguments: { pageSize: 2 } })
  const text = collections.content?.[0]?.text ?? ''
  check('list_collections responde con datos', !collections.isError && text.includes('Animalitos'))

  const tags = await client.callTool({ name: 'list_tags', arguments: {} })
  check('list_tags responde', !tags.isError)

  // Scope insuficiente: get_admin_stats requiere stats:read (y ADMIN)
  const admin = await client.callTool({ name: 'get_admin_stats', arguments: {} })
  check('get_admin_stats denegado sin scope stats:read', admin.isError === true)

  await client.close()
} catch (e) {
  console.error('MCP ERROR:', e.message)
  check('ejecución sin excepciones', false)
}

const ok = results.filter(Boolean).length
console.log(`\n${ok}/${results.length} checks OK`)
process.exit(ok === results.length ? 0 : 1)
