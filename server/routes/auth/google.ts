const config = useRuntimeConfig()

export default defineOAuthGoogleEventHandler({
  config: {
    clientId: config.oauth.google.id,
    clientSecret: config.oauth.google.secret,
  },
  async onSuccess(event, { user: googleUser }) {
    // Crear o actualizar usuario en BD
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'google',
          providerId: googleUser.sub,
        },
      },
      include: { user: true },
    })

    let user

    if (existingOAuth) {
      // Actualizar último acceso
      user = await prisma.user.update({
        where: { id: existingOAuth.userId },
        data: { lastLoginAt: new Date() },
      })
    } else {
      // Verificar si el email ya existe
      const existingByEmail = await prisma.user.findUnique({
        where: { email: googleUser.email },
      })

      if (existingByEmail) {
        // Usuario existe pero sin OAuth Google, agregar la cuenta OAuth
        user = existingByEmail
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'google',
            providerId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name || '',
            avatarUrl: googleUser.picture,
          },
        })
      } else {
        // Crear nuevo usuario
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name || googleUser.email,
            avatarUrl: googleUser.picture,
            oauthAccounts: {
              create: {
                provider: 'google',
                providerId: googleUser.sub,
                email: googleUser.email,
                name: googleUser.name || '',
                avatarUrl: googleUser.picture,
              },
            },
          },
        })
      }
    }

    // Crear sesión
    await setUserSession(event, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    // Redirigir a home
    await sendRedirect(event, '/')
  },
  async onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/auth/error?provider=google')
  },
})
