import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from '~/server/utils/db'
import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_SIZE,
  UPLOAD_DIR,
  extensionForMime,
  sniffImageType,
} from '~/server/utils/uploads'

const ALLOWED_EXTERNAL_IMAGE_HOSTS = new Set([
  'images.unsplash.com',
  'makerworld.bblmw.com',
])

const localizing = new Set<string>()

async function readLimitedBody(response: Response): Promise<Buffer> {
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > MAX_UPLOAD_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'La imagen supera el límite de 5 MB' })
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > MAX_UPLOAD_SIZE) {
      throw createError({ statusCode: 413, statusMessage: 'La imagen supera el límite de 5 MB' })
    }
    return buffer
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_UPLOAD_SIZE) {
        await reader.cancel().catch(() => {})
        throw createError({ statusCode: 413, statusMessage: 'La imagen supera el límite de 5 MB' })
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))
}

export const fileService = {
  async list(page = 1, pageSize = 50) {
    const currentPage = Math.max(1, page)
    const take = Math.min(100, Math.max(1, pageSize))
    const [total, files] = await Promise.all([
      prisma.file.count(),
      prisma.file.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (currentPage - 1) * take,
        take,
      }),
    ])
    return { data: files, total, page: currentPage, pageSize: take }
  },

  /**
   * Registra una URL externa como `File` (sin subir binario). Allowlist
   * anti-SSRF: solo `/uploads/…` o hosts de imagen permitidos (Unsplash y el
   * CDN de MakerWorld para la importación de m19).
   */
  async registerUrl(input: { url: string; mimeType?: string }) {
    const url = input.url.trim()
    const allowed =
      url.startsWith('/uploads/') ||
      (() => {
        try {
          const u = new URL(url)
          return u.protocol === 'https:' && ALLOWED_EXTERNAL_IMAGE_HOSTS.has(u.hostname)
        } catch {
          return false
        }
      })()

    if (!allowed) {
      throw createError({
        statusCode: 422,
        statusMessage: 'URL no permitida (solo /uploads/…, images.unsplash.com o makerworld.bblmw.com)',
      })
    }

    const existing = await prisma.file.findUnique({ where: { url } })
    if (existing) return existing

    return prisma.file.create({ data: { url, mimeType: input.mimeType ?? null } })
  },

  /**
   * Descarga una imagen remota permitida a `public/uploads` y actualiza el
   * mismo `File` (url/path/mimeType/size). Las relaciones existentes
   * (ItemFile/CollectionFile) se conservan porque no cambia el id.
   */
  async localize(id: string) {
    const file = await prisma.file.findUnique({ where: { id } })
    if (!file) throw createError({ statusCode: 404, statusMessage: 'Archivo no encontrado' })

    // Idempotente: si ya es local, no hay nada que descargar.
    if (file.url.startsWith('/uploads/')) return file

    if (localizing.has(id)) {
      throw createError({ statusCode: 409, statusMessage: 'La imagen ya se está guardando en local' })
    }

    let remote: URL
    try {
      remote = new URL(file.url)
    } catch {
      throw createError({ statusCode: 422, statusMessage: 'La URL del archivo no es válida' })
    }

    if (remote.protocol !== 'https:' || !ALLOWED_EXTERNAL_IMAGE_HOSTS.has(remote.hostname)) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Solo se pueden guardar imágenes de images.unsplash.com o makerworld.bblmw.com',
      })
    }

    localizing.add(id)
    try {
      let response: Response
      try {
        response = await fetch(remote, {
          headers: {
            accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/*',
          },
          redirect: 'manual',
          signal: AbortSignal.timeout(20_000),
        })
      } catch {
        throw createError({ statusCode: 502, statusMessage: 'No se pudo descargar la imagen remota' })
      }

      if (!response.ok) {
        throw createError({
          statusCode: 502,
          statusMessage: `El servidor de la imagen respondió con estado ${response.status}`,
        })
      }

      const buffer = await readLimitedBody(response)
      const declaredMime = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
      const detected = ALLOWED_IMAGE_MIME.has(declaredMime)
        ? { mime: declaredMime, ext: extensionForMime(declaredMime)! }
        : sniffImageType(buffer)

      if (!detected) {
        throw createError({ statusCode: 422, statusMessage: 'La URL no devolvió una imagen válida (JPEG, PNG, WebP o GIF)' })
      }

      const filename = `${crypto.randomUUID()}${detected.ext}`
      const fullPath = join(UPLOAD_DIR, filename)
      await mkdir(UPLOAD_DIR, { recursive: true })
      await writeFile(fullPath, buffer)

      try {
        return await prisma.file.update({
          where: { id },
          data: {
            url: `/uploads/${filename}`,
            path: join('public', 'uploads', filename),
            mimeType: detected.mime,
            size: buffer.byteLength,
          },
        })
      } catch (error) {
        await unlink(fullPath).catch(() => {})
        throw error
      }
    } finally {
      localizing.delete(id)
    }
  },
}
