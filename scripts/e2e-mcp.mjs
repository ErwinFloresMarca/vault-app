import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const URL_MCP = process.env.MCP_URL || 'http://localhost:3000/mcp'
const KEY = process.env.MCP_KEY
const WRITE = process.env.MCP_WRITE === '1'
if (!KEY) {
  console.error('Falta MCP_KEY (crea una con: pnpm mcp:key --scopes catalog:read)')
  process.exit(1)
}

const results = []
const check = (name, ok) => {
  results.push(ok)
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`)
}
const json = (res) => {
  try {
    return JSON.parse(res.content?.[0]?.text ?? 'null')
  } catch {
    return null
  }
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

  const admin = await client.callTool({ name: 'get_admin_stats', arguments: {} })
  check('get_admin_stats denegado sin scope stats:read', admin.isError === true)

  if (WRITE) {
    const gate = await client.callTool({ name: 'upsert_tag', arguments: { name: 'mcp-smoke' } })
    check('upsert_tag', !gate.isError)

    const created = await client.callTool({
      name: 'create_collection',
      arguments: { name: `MCP Smoke ${Date.now()}`, description: 'colección de prueba MCP', status: 'PUBLISHED', tags: ['mcp-smoke'] },
    })
    const collectionId = json(created)?.id
    check('create_collection', !created.isError && !!collectionId)

    const item = await client.callTool({
      name: 'create_item',
      arguments: { name: 'MCP Item', collectionId, stockInicial: 3, rarity: 'RARE' },
    })
    const itemId = json(item)?.id
    check('create_item (stock inicial + rareza)', !item.isError && !!itemId)

    const rarity = itemId
      ? await client.callTool({ name: 'set_item_rarity', arguments: { id: itemId, rarity: 'EPIC' } })
      : { isError: true }
    check('set_item_rarity', !rarity.isError)

    const listed = await client.callTool({ name: 'list_items', arguments: { collectionId } })
    const listedItem = json(listed)?.data?.[0]
    check('list_items refleja rareza/stock', listedItem?.rarity === 'EPIC' && listedItem?.stock === 3)

    const noConfirm = itemId
      ? await client.callTool({ name: 'archive_item', arguments: { id: itemId } })
      : { isError: false }
    check('archive_item sin confirm → error', noConfirm.isError === true)

    const confirmed = itemId
      ? await client.callTool({ name: 'archive_item', arguments: { id: itemId, confirm: true } })
      : { isError: true }
    check('archive_item con confirm → ok', !confirmed.isError)

    const badUrl = await client.callTool({
      name: 'register_file_url',
      arguments: { url: 'https://evil.example/x.png' },
    })
    check('register_file_url dominio no permitido → error', badUrl.isError === true)

    const okUrl = await client.callTool({
      name: 'register_file_url',
      arguments: { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600' },
    })
    check('register_file_url allowlist → ok', !okUrl.isError)

    const archived = collectionId
      ? await client.callTool({ name: 'archive_collection', arguments: { id: collectionId, confirm: true } })
      : { isError: true }
    check('archive_collection con confirm → ok', !archived.isError)
  }

  await client.close()
} catch (e) {
  console.error('MCP ERROR:', e.message)
  check('ejecución sin excepciones', false)
}

const ok = results.filter(Boolean).length
console.log(`\n${ok}/${results.length} checks OK`)
process.exit(ok === results.length ? 0 : 1)
