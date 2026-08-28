import type { H3Event } from 'h3'
import { prisma } from './db'

/**
 * Lee la sesión actual. Devuelve el usuario de BD o null.
 */
export async function getCurrentUser(event: H3Event) {
  const { user: sessionUser } = await getUserSession(event)
  if (!sessionUser?.id) return null
  return prisma.user.findUnique({ where: { id: sessionUser.id } })
}

/**
 * Requiere un usuario autenticado. Lanza 401 si no lo está.
 */
export async function requireUser(event: H3Event) {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }
  return user
}

/**
 * Requiere un usuario ADMIN. Lanza 401/403 si no cumple.
 */
export async function requireAdmin(event: H3Event) {
  const user = await requireUser(event)
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Requiere rol ADMIN' })
  }
  return user
}
