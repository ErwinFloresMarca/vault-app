<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden px-4">

    <div class="relative w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mb-4 flex justify-center">
          <img src="/logos/volt-vault-logo.png" alt="Volt Vault" class="size-20 object-contain">
        </div>
        <h1 class="font-display text-3xl font-extrabold tracking-tight">Volt Vault</h1>
        <p class="label-caps mt-2 text-volt">La bóveda de coleccionables</p>
      </div>

      <UCard>
        <template #header>
          <div class="text-center">
            <h2 class="font-display text-xl font-bold">Inicia sesión</h2>
            <p class="mt-1 text-sm text-muted">O crea una cuenta nueva</p>
          </div>
        </template>

        <div class="space-y-3">
          <UButton
            to="/auth/google"
            external
            block
            size="lg"
            color="neutral"
            variant="subtle"
            icon="i-lucide-chrome"
          >
            Continuar con Google
          </UButton>

          <UButton
            to="/auth/facebook"
            external
            block
            size="lg"
            color="secondary"
            icon="i-lucide-facebook"
          >
            Continuar con Facebook
          </UButton>
        </div>

        <template #footer>
          <p class="text-center text-xs text-muted">
            Al continuar, aceptas nuestros
            <NuxtLink to="/terms" class="text-volt hover:underline">Términos de Servicio</NuxtLink>
            y la
            <NuxtLink to="/privacy" class="text-volt hover:underline">Política de Privacidad</NuxtLink>
          </p>
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

watch(isAuthenticated, (newVal) => {
  if (newVal) {
    navigateTo('/')
  }
})

const route = useRoute()
if (route.query.provider && route.query.error) {
  console.error(`Error al autenticarse con ${route.query.provider}`, route.query.error)
}
</script>
