import { join } from 'node:path'

export const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5 MB

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export function extensionForMime(mime: string): string | null {
  return IMAGE_EXTENSION_BY_MIME[mime] ?? null
}

/**
 * Detecta el tipo real por magic bytes. Sirve para CDNs que devuelven
 * `application/octet-stream` aunque el contenido sea WebP/PNG/JPEG/GIF.
 */
export function sniffImageType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', ext: '.webp' }
  }

  if (buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', ext: '.png' }
  }

  if (buffer.length >= 3
    && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' }
  }

  const header = buffer.subarray(0, 6).toString('ascii')
  if (header === 'GIF87a' || header === 'GIF89a') {
    return { mime: 'image/gif', ext: '.gif' }
  }

  return null
}
