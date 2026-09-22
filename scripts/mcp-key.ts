import 'dotenv/config'
import { PrismaClient } from './../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { generateApiKey, hashApiKey } from '../server/mcp/hash'

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: pool })

function arg(name: string, def?: string) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def
}

async function main() {
  const name = arg('name', 'MCP client')!
  const email = arg('email')
  const scopes = (arg('scopes', 'catalog:read') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const key = generateApiKey()
  const keyHash = hashApiKey(key)
  const prefix = key.slice(0, 8)

  const user = email
    ? await prisma.user.findUnique({ where: { email } })
    : await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } })

  if (!user) {
    console.error('No hay usuario. Usa --email <email> o crea un usuario ADMIN.')
    process.exit(1)
  }

  const apiKey = await prisma.apiKey.create({
    data: { name, keyHash, prefix, userId: user.id, scopes },
  })

  console.log('✅ API key creada (se muestra UNA sola vez):\n')
  console.log(key)
  console.log(`\nid=${apiKey.id}\nusuario=${user.email}\nscopes=${scopes.join(', ')}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
