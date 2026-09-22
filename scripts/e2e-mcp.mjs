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

  const { resources } = await client.listResources()
  check(`listResources (${resources.length})`, resources.length > 0)

  const { resourceTemplates } = await client.listResourceTemplates()
  check(`listResourceTemplates (${resourceTemplates.length})`, resourceTemplates.length > 0)

  const { prompts } = await client.listPrompts()
  check(`listPrompts (${prompts.length})`, prompts.length > 0)

  const collectionsRes = await client.readResource({ uri: 'voltvault://collections' })
  check('readResource voltvault://collections', !!collectionsRes.contents?.[0]?.text)

  const collections = await client.callTool({ name: 'list_collections', arguments: { pageSize: 2 } })
  check('list_collections responde con datos', !collections.isError && (collections.content?.[0]?.text ?? '').includes('Animalitos'))

  const admin = await client.callTool({ name: 'get_admin_stats', arguments: {} })
  check(
    WRITE ? 'get_admin_stats permitido con scope stats:read' : 'get_admin_stats denegado sin scope stats:read',
    WRITE ? !admin.isError : admin.isError === true,
  )

  if (WRITE) {
    await client.callTool({ name: 'upsert_tag', arguments: { name: 'mcp-smoke' } })

    const created = await client.callTool({
      name: 'create_collection',
      arguments: { name: `MCP Smoke ${Date.now()}`, status: 'PUBLISHED', tags: ['mcp-smoke'] },
    })
    const collectionId = json(created)?.id
    check('create_collection', !created.isError && !!collectionId)

    const item = await client.callTool({
      name: 'create_item',
      arguments: { name: 'MCP Item', collectionId, stockInicial: 3, rarity: 'RARE' },
    })
    const itemId = json(item)?.id
    check('create_item (stock inicial + rareza)', !item.isError && !!itemId)

    check('set_item_rarity', !(await client.callTool({ name: 'set_item_rarity', arguments: { id: itemId, rarity: 'EPIC' } })).isError)

    const listed = await client.callTool({ name: 'list_items', arguments: { collectionId } })
    const listedItem = json(listed)?.data?.[0]
    check('list_items refleja rareza/stock', listedItem?.rarity === 'EPIC' && listedItem?.stock === 3)

    // Inventario
    check('adjust_stock (IN)', !(await client.callTool({ name: 'adjust_stock', arguments: { itemId, type: 'IN', quantity: 5, reason: 'mcp smoke' } })).isError)
    check('create_inventory_batch', !(await client.callTool({
      name: 'create_inventory_batch',
      arguments: { type: 'IN', lines: [{ itemId, quantity: 2 }], reason: 'mcp batch' },
    })).isError)
    const movements = json(await client.callTool({ name: 'list_inventory_movements', arguments: { itemId } }))
    check('list_inventory_movements con movimientos', (movements?.total ?? 0) >= 1)

    // Personal
    check('collect_item', !(await client.callTool({ name: 'collect_item', arguments: { itemId } })).isError)
    const myCol = json(await client.callTool({ name: 'list_my_collection', arguments: {} }))
    check('list_my_collection incluye el item', (myCol?.data ?? []).some((e) => e.item?.id === itemId))
    const myStats = json(await client.callTool({ name: 'get_my_stats', arguments: {} }))
    check('get_my_stats', (myStats?.collectedItems ?? 0) >= 1)
    check('uncollect_item', !(await client.callTool({ name: 'uncollect_item', arguments: { itemId } })).isError)
    check('add_wishlist', !(await client.callTool({ name: 'add_wishlist', arguments: { itemId } })).isError)
    check('remove_wishlist', !(await client.callTool({ name: 'remove_wishlist', arguments: { itemId } })).isError)

    // Admin
    const users = json(await client.callTool({ name: 'list_users', arguments: { role: 'ADMIN' } }))
    check('list_users', Array.isArray(users) && users.length >= 1)
    check('set_user_role sin confirm → error', (await client.callTool({ name: 'set_user_role', arguments: { userId: 'x', role: 'USER' } })).isError === true)

    // Archivos
    check('register_file_url dominio no permitido → error', (await client.callTool({ name: 'register_file_url', arguments: { url: 'https://evil.example/x.png' } })).isError === true)
    check('register_file_url allowlist → ok', !(await client.callTool({ name: 'register_file_url', arguments: { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600' } })).isError)

    // Destructivas con confirm
    check('archive_item sin confirm → error', (await client.callTool({ name: 'archive_item', arguments: { id: itemId } })).isError === true)
    check('archive_item con confirm → ok', !(await client.callTool({ name: 'archive_item', arguments: { id: itemId, confirm: true } })).isError)
    check('archive_collection con confirm → ok', !(await client.callTool({ name: 'archive_collection', arguments: { id: collectionId, confirm: true } })).isError)

    const prompt = await client.getPrompt({ name: 'describe_collection', arguments: { slug: 'animalitos-flexibles' } })
    check('getPrompt describe_collection', (prompt.messages?.length ?? 0) > 0)
  }

  await client.close()
} catch (e) {
  console.error('MCP ERROR:', e.message)
  check('ejecución sin excepciones', false)
}

const ok = results.filter(Boolean).length
console.log(`\n${ok}/${results.length} checks OK`)
process.exit(ok === results.length ? 0 : 1)
