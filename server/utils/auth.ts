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

/**
 * Administradores por configuración: si el correo del usuario está en
 * NUXT_ADMIN_EMAILS (lista separada por comas), se le asigna el rol ADMIN al
 * iniciar sesión. Solo asciende (nunca quita el rol a nadie).
 */
export async function promoteConfiguredAdmin<T extends { id: string; email: string; role: string }>(user: T): Promise<T> {
  const list = String(useRuntimeConfig().adminEmails || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (user.role === 'ADMIN' || !list.includes(user.email.trim().toLowerCase())) return user
  const updated = await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  return { ...user, role: updated.role }
}
