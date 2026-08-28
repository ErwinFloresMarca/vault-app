import { readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'No se recibió el archivo' })
  }

  const filePart = form.find((part) => part.name === 'file')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'Falta el campo "file"' })
  }

  if (!ALLOWED_MIME.has(filePart.type || '')) {
    throw createError({ statusCode: 422, statusMessage: `Tipo de archivo no permitido: ${filePart.type}` })
  }
  if (filePart.data.byteLength > MAX_SIZE) {
    throw createError({ statusCode: 422, statusMessage: 'El archivo supera el tamaño máximo de 5 MB' })
  }

  const ext = extname(filePart.filename) || ''
  const id = crypto.randomUUID()
  const filename = `${id}${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), filePart.data)

  const file = await prisma.file.create({
    data: {
      url: `/uploads/${filename}`,
      path: join('public', 'uploads', filename),
      mimeType: filePart.type || null,
      size: filePart.data.byteLength,
    },
  })

  return { success: true, file }
})
