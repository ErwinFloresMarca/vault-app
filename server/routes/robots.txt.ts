// robots.txt dinámico. Se enriquece en el módulo SEO.
export default defineEventHandler(() => {
  return [
    'User-Agent: *',
    'Disallow: /admin/',
    'Allow: /',
    '',
    'Sitemap: /sitemap.xml',
  ].join('\n')
})
