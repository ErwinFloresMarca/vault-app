<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo y título -->
      <div class="text-center mb-8">
        <div class="mb-4">
          <img
            src="/logos/volt3d-icon.svg"
            alt="Volt3D"
            class="h-16 w-16 mx-auto"
          />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Volt3D</h1>
        <p class="text-gray-400">Impresión 3D con Voltaje</p>
      </div>

      <!-- Card de login -->
      <UCard class="mb-6">
        <template #header>
          <div class="text-center">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Inicia sesión
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              O crea una cuenta nueva
            </p>
          </div>
        </template>

        <div class="space-y-3">
          <!-- Google -->
          <a
            href="/auth/google"
            class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Icon name="logos:google-icon" class="h-5 w-5" />
            Continuar con Google
          </a>

          <!-- Facebook -->
          <a
            href="/auth/facebook"
            class="w-full px-4 py-2.5 bg-blue-600 rounded-lg font-medium text-white hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Icon name="logos:facebook" class="h-5 w-5" />
            Continuar con Facebook
          </a>
        </div>

        <template #footer>
          <div class="text-center text-xs text-gray-500">
            <p>
              Al continuar, aceptas nuestros
              <NuxtLink to="/terms" class="text-blue-600 hover:underline">
                Términos de Servicio
              </NuxtLink>
              y
              <NuxtLink to="/privacy" class="text-blue-600 hover:underline">
                Política de Privacidad
              </NuxtLink>
            </p>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'minimal',
})

const { isAuthenticated } = useAuthUser()

// Si ya está autenticado, redirigir a home
watch(isAuthenticated, (newVal) => {
  if (newVal) {
    navigateTo('/')
  }
})

// Verificar si hay error de OAuth
const route = useRoute()
if (route.query.provider && route.query.error) {
  const message = `Error al autenticarse con ${route.query.provider}`
  console.error(message, route.query.error)
  // Mostrar notificación de error
}
</script>
