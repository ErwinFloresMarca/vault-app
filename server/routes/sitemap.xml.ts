// Sitemap básico (placeholder). Se enriquece en el módulo SEO con
// colecciones e items publicados.
export default defineEventHandler(() => {
  const base = 'https://local.volt-vault.dev' // TODO: usar NUXT_API_BASE_URL / siteUrl
  const urls = [
    '/',
    '/collections',
  ].map((path) => {
    const loc = `${base}${path}`
    return `  <url><loc>${loc}</loc></url>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
})
