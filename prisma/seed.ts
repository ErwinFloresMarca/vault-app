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
  const coll1Description =
    '# Animalitos Flexibles\n\nUna colección de pequeños animales articulados y flexibles.\n\n## Características\n\n- Diseño flexible\n- Piezas articuladas\n- Diferentes colores\n- Colección limitada\n\n> ¡Colecciónalos todos!'
  const coll1 = await prisma.collection.upsert({
    where: { slug: coll1Slug },
    update: { name: 'Animalitos Flexibles', description: coll1Description },
    create: {
      name: 'Animalitos Flexibles',
      slug: coll1Slug,
      description: coll1Description,
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
  // Idempotente: sólo aplica si aún no hay movimientos de seed (evita inflar el stock).
  const seedMovements = await prisma.inventoryMovement.count({ where: { reason: 'seed' } })
  if (seedMovements === 0) {
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
  } else {
    console.log('· Movimientos de inventario ya existen (seed idempotente)')
  }

  // ===== COLECCIÓN 2: Criaturas Fantásticas =====
  const coll2Slug = 'edicion-especial-dragones'
  const coll2Description =
    '# Criaturas Fantásticas\n\nColección de criaturas míticas de fantasía.\n\n- Dragones\n- Criaturas\n\nPróximamente más.'
  const coll2 = await prisma.collection.upsert({
    where: { slug: coll2Slug },
    update: { name: 'Criaturas Fantásticas', description: coll2Description },
    create: {
      name: 'Criaturas Fantásticas',
      slug: coll2Slug,
      description: coll2Description,
      status: 'PUBLISHED',
      orderIndex: 1,
      tags: {
        create: [{ tag: { connect: { id: tags.get('Fantasía')! } } }],
      },
    },
  })
  console.log('✓ Colección "Criaturas Fantásticas"')

  // ===== Portadas de colección + colecciones adicionales (SEL-72) =====
  async function ensureCollectionCover(collectionId: string, url: string, alt: string) {
    const file = await ensureFile(url)
    await prisma.collectionFile.upsert({
      where: { collectionId_fileId: { collectionId, fileId: file.id } },
      update: { position: 0, alt },
      create: { collectionId, fileId: file.id, position: 0, alt },
    })
  }

  async function ensureItem(
    collectionId: string,
    name: string,
    slug: string,
    coverUrl: string,
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY',
  ) {
    const file = await ensureFile(coverUrl)
    const description = `${name}, pieza de colección de Volt Vault.`
    await prisma.collectionItem.upsert({
      where: { slug },
      update: { rarity, description },
      create: {
        collectionId,
        name,
        slug,
        description,
        rarity,
        status: 'AVAILABLE',
        files: { create: [{ fileId: file.id, position: 0, alt: name }] },
      },
    })
  }

  await ensureCollectionCover(coll1.id, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600', 'Animalitos Flexibles')
  await ensureCollectionCover(coll2.id, 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600', 'Criaturas Fantásticas')

  const coll3 = await prisma.collection.upsert({
    where: { slug: 'macetas-geometricas' },
    update: { name: 'Macetas Geométricas', description: '# Macetas Geométricas\n\nMacetas y maceteros de diseño geométrico.' },
    create: {
      name: 'Macetas Geométricas',
      slug: 'macetas-geometricas',
      description: '# Macetas Geométricas\n\nMacetas y maceteros de diseño geométrico.',
      status: 'PUBLISHED',
      orderIndex: 2,
      tags: { create: [{ tag: { connect: { id: tags.get('Macetas')! } } }] },
    },
  })
  await ensureCollectionCover(coll3.id, 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600', 'Macetas Geométricas')
  await ensureItem(coll3.id, 'Maceta Hexagonal', 'maceta-hexagonal', 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600', 'COMMON')
  await ensureItem(coll3.id, 'Maceta Espiral', 'maceta-espiral', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600', 'RARE')

  const coll4 = await prisma.collection.upsert({
    where: { slug: 'llaveros-gamer' },
    update: { name: 'Llaveros Gamer', description: '# Llaveros Gamer\n\nLlaveros con iconos gamer y pixel art.' },
    create: {
      name: 'Llaveros Gamer',
      slug: 'llaveros-gamer',
      description: '# Llaveros Gamer\n\nLlaveros con iconos gamer y pixel art.',
      status: 'PUBLISHED',
      orderIndex: 3,
      tags: { create: [{ tag: { connect: { id: tags.get('Personalizado')! } } }] },
    },
  })
  await ensureCollectionCover(coll4.id, 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600', 'Llaveros Gamer')
  await ensureItem(coll4.id, 'Llavero Pixel', 'llavero-pixel', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600', 'COMMON')
  await ensureItem(coll4.id, 'Llavero Volt', 'llavero-volt', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600', 'EPIC')
  console.log('✓ Portadas y colecciones adicionales')

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
