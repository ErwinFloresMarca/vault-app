import { prisma } from '~/server/utils/db'

export default defineEventHandler(async () => {
  const base = process.env.SITE_URL ?? 'https://local.volt-vault.dev'

  const url = (path: string) => `  <url><loc>${base}${path}</loc></url>`

  const [collections, items] = await Promise.all([
    prisma.collection.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true } }),
    prisma.collectionItem.findMany({
      where: { AND: [{ status: { not: 'ARCHIVED' } }, { collection: { status: 'PUBLISHED' } }] },
      select: { slug: true, collection: { select: { slug: true } } },
    }),
  ])

  const lines = [
    url('/'),
    url('/collections'),
    ...collections.map((c) => url(`/collections/${c.slug}`)),
    ...items.map((i) => url(`/collections/${i.collection.slug}/${i.slug}`)),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>`
})
