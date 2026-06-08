const config = useRuntimeConfig()

export default defineOAuthFacebookEventHandler({
  config: {
    clientId: config.oauth.facebook.id,
    clientSecret: config.oauth.facebook.secret,
  },
  async onSuccess(event, { user: fbUser }) {
    // Crear o actualizar usuario en BD
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: 'facebook',
          providerId: fbUser.id,
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
        where: { email: fbUser.email },
      })

      if (existingByEmail) {
        // Usuario existe pero sin OAuth Facebook, agregar la cuenta OAuth
        user = existingByEmail
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'facebook',
            providerId: fbUser.id,
            email: fbUser.email,
            name: fbUser.name || '',
            avatarUrl: fbUser.picture?.data?.url,
          },
        })
      } else {
        // Crear nuevo usuario
        user = await prisma.user.create({
          data: {
            email: fbUser.email,
            name: fbUser.name || fbUser.email,
            avatarUrl: fbUser.picture?.data?.url,
            oauthAccounts: {
              create: {
                provider: 'facebook',
                providerId: fbUser.id,
                email: fbUser.email,
                name: fbUser.name || '',
                avatarUrl: fbUser.picture?.data?.url,
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
    console.error('Facebook OAuth error:', error)
    return sendRedirect(event, '/auth/error?provider=facebook')
  },
})
