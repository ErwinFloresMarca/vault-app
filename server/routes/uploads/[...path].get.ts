import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { UPLOAD_DIR } from '~/server/utils/uploads'

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

const SAFE_FILENAME = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|avif)$/i

/**
 * Sirve los uploads locales. Nitro en producción solo publica `.output/public`,
 * así que sin esta ruta un archivo escrito en `public/uploads` en runtime no
 * sería accesible (el deploy reemplaza `.output` pero conserva `public/`).
 */
export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'path')

  if (!filename || !SAFE_FILENAME.test(filename)) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const fullPath = join(UPLOAD_DIR, filename)

  try {
    const data = await readFile(fullPath)
    setHeader(event, 'content-type', MIME_BY_EXT[extname(filename).toLowerCase()] ?? 'application/octet-stream')
    setHeader(event, 'cache-control', 'public, max-age=31536000, immutable')
    return data
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
