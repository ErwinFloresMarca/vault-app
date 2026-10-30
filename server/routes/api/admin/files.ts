import { readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { requireAdmin } from '~/server/utils/auth'
import { prisma } from '~/server/utils/db'
import { ALLOWED_IMAGE_MIME, IMAGE_EXTENSION_BY_MIME, MAX_UPLOAD_SIZE, UPLOAD_DIR } from '~/server/utils/uploads'

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

  if (!ALLOWED_IMAGE_MIME.has(filePart.type || '')) {
    throw createError({ statusCode: 422, statusMessage: `Tipo de archivo no permitido: ${filePart.type}` })
  }
  if (filePart.data.byteLength > MAX_UPLOAD_SIZE) {
    throw createError({ statusCode: 422, statusMessage: 'El archivo supera el tamaño máximo de 5 MB' })
  }

  // La extensión sale del MIME permitido, no del nombre original.
  const ext = IMAGE_EXTENSION_BY_MIME[filePart.type || ''] ?? '.bin'
  const id = crypto.randomUUID()
  const filename = `${id}${ext}`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, filename), filePart.data)

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
