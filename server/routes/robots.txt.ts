export default defineEventHandler(() => {
  const base = process.env.SITE_URL ?? 'https://local.volt-vault.dev'
  return [
    'User-Agent: *',
    'Disallow: /admin/',
    'Allow: /',
    '',
    `Sitemap: ${base}/sitemap.xml`,
  ].join('\n')
})
