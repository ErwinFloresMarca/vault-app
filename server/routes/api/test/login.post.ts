/**
 * Login de TEST para E2E (SEL-73). NO disponible en producción:
 * solo responde en dev o cuando E2E_TEST=1.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev && process.env.E2E_TEST !== '1') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const body = await readBody<{ email?: string; name?: string; role?: 'USER' | 'ADMIN' }>(event)
  const email = body?.email || 'e2e@volt3d.test'
  const name = body?.name || 'E2E Tester'
  const role = body?.role === 'ADMIN' ? 'ADMIN' : 'USER'

  const user = await prisma.user.upsert({
    where: { email },
    update: { role, name },
    create: { email, name, role },
  })

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })

  return { success: true, user: { id: user.id, email: user.email, role: user.role } }
})
