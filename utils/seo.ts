/**
 * Utilidades SEO compartidas (front + server).
 */

/** Convierte Markdown a texto plano y lo trunca para meta description. */
export function metaDescription(markdown: string | null | undefined, fallback = '', max = 160): string {
  if (!markdown) return fallback
  const text = markdown
    .replace(/\r/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return fallback
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/** Absolutiza una URL relativa (p. ej. `/uploads/x.png`) usando la base del sitio. */
export function absoluteUrl(url: string | null | undefined, base = ''): string | undefined {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  const cleanBase = base.replace(/\/$/, '')
  return `${cleanBase}${url.startsWith('/') ? url : `/${url}`}`
}
