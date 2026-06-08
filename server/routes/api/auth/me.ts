

export default defineEventHandler(async (event) => {
  // Obtener usuario actual desde la sesión
  const user = await getUserSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No autenticado',
    })
  }

  // Obtener datos del usuario desde BD
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      oauthAccounts: true,
    },
  })

  if (!dbUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Usuario no encontrado',
    })
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl,
    role: dbUser.role,
    lastLoginAt: dbUser.lastLoginAt,
    oauthProviders: dbUser.oauthAccounts.map((acc) => acc.provider),
  }
})
