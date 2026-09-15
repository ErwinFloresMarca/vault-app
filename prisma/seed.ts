import { PrismaClient } from './../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter: pool })

async function main() {
  console.log('🌱 Seeding Volt Vault...')

  // ===== TAGS =====
  const tagNames = ['Animales', 'Flexibles', 'Fantasía', 'Macetas', 'Personalizado', 'Edición Limitada']
  const tags = new Map<string, string>()
  for (const name of tagNames) {
    const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-')
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    })
    tags.set(name, tag.id)
  }
  console.log(`✓ ${tags.size} tags`)

  // ===== FILES (urls externas de ejemplo) =====
  async function ensureFile(url: string) {
    return prisma.file.upsert({
      where: { url },
      update: {},
      create: { url, mimeType: 'image/webp' },
    })
  }

  // ===== COLECCIÓN 1: Animalitos Flexibles =====
  const coll1Slug = 'animalitos-flexibles'
  const coll1 = await prisma.collection.upsert({
    where: { slug: coll1Slug },
    update: {},
    create: {
      name: 'Animalitos Flexibles',
      slug: coll1Slug,
      description:
        '# Animalitos Flexibles\n\nUna colección de pequeños animales articulados impresos en 3D.\n\n## Características\n\n- Diseño flexible\n- Impresión 3D\n- Diferentes colores\n- Colección limitada\n\n> ¡Colecciónalos todos!',
      status: 'PUBLISHED',
      orderIndex: 0,
      tags: {
        create: [
          { tag: { connect: { id: tags.get('Animales')! } } },
          { tag: { connect: { id: tags.get('Flexibles')! } } },
        ],
      },
    },
  })

  const catFile = await ensureFile('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600')
  const dogFile = await ensureFile('https://images.unsplash.com/photo-1552053831-71594a27632d?w=600')
  const foxFile = await ensureFile('https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=600')

  const cat = await prisma.collectionItem.upsert({
    where: { slug: 'gato' },
    update: { rarity: 'COMMON' },
    create: {
      collectionId: coll1.id,
      name: 'Gato',
      slug: 'gato',
      description: 'Un gato flexible articulado.',
      rarity: 'COMMON',
      stock: 0,
      soldQuantity: 0,
      status: 'AVAILABLE',
      files: { create: [{ fileId: catFile.id, position: 0, alt: 'Gato flexible' }] },
    },
  })
  const dog = await prisma.collectionItem.upsert({
    where: { slug: 'perro' },
    update: { rarity: 'RARE' },
    create: {
      collectionId: coll1.id,
      name: 'Perro',
      slug: 'perro',
      description: 'Un perro flexible articulado.',
      rarity: 'RARE',
      stock: 0,
      soldQuantity: 0,
      status: 'AVAILABLE',
      files: { create: [{ fileId: dogFile.id, position: 0, alt: 'Perro flexible' }] },
    },
  })
  const fox = await prisma.collectionItem.upsert({
    where: { slug: 'zorro' },
    update: { rarity: 'EPIC' },
    create: {
      collectionId: coll1.id,
      name: 'Zorro',
      slug: 'zorro',
      description: 'Un zorro flexible articulado.',
      rarity: 'EPIC',
      stock: 0,
      soldQuantity: 0,
      status: 'AVAILABLE',
      files: { create: [{ fileId: foxFile.id, position: 0, alt: 'Zorro flexible' }] },
    },
  })
  console.log(`✓ Colección "${coll1.name}" con items: ${cat.name}, ${dog.name}, ${fox.name}`)

  // ===== Movimientos de inventario de ejemplo =====
  // Ajuste inicial de stock (absoluto) + ventas, vía movimientos → stock/soldQuantity consistentes.
  const movements: Array<{ item: typeof cat; type: 'IN' | 'SALE'; qty: number }> = [
    { item: cat, type: 'IN', qty: 100 },
    { item: cat, type: 'SALE', qty: 40 },
    { item: dog, type: 'IN', qty: 80 },
    { item: dog, type: 'SALE', qty: 25 },
    { item: fox, type: 'IN', qty: 60 },
    { item: fox, type: 'SALE', qty: 10 },
  ]
  for (const m of movements) {
    await prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.create({
        data: { itemId: m.item.id, type: m.type, quantity: m.qty, reason: 'seed' },
      })
      const moveItem = await tx.collectionItem.findUnique({ where: { id: m.item.id } })
      if (!moveItem) return
      if (m.type === 'IN') {
        await tx.collectionItem.update({
          where: { id: m.item.id },
          data: { stock: moveItem.stock + m.qty },
        })
      } else if (m.type === 'SALE') {
        await tx.collectionItem.update({
          where: { id: m.item.id },
          data: { stock: moveItem.stock - m.qty, soldQuantity: moveItem.soldQuantity + m.qty },
        })
      }
    })
  }
  console.log('✓ Movimientos de inventario de ejemplo')

  // ===== COLECCIÓN 2: Edición Especial (placeholder básica) =====
  const coll2Slug = 'edicion-especial-dragones'
  await prisma.collection.upsert({
    where: { slug: coll2Slug },
    update: {},
    create: {
      name: 'Criaturas Fantásticas',
      slug: coll2Slug,
      description: '# Criaturas Fantásticas\n\nColección de criaturas míticas impresas en 3D.\n\n- Dragones\n- Criaturas\n\nPróximamente más.',
      status: 'PUBLISHED',
      orderIndex: 1,
      tags: {
        create: [{ tag: { connect: { id: tags.get('Fantasía')! } } }],
      },
    },
  })
  console.log('✓ Colección "Criaturas Fantásticas"')

  console.log('✨ Seeding Volt Vault completado!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
