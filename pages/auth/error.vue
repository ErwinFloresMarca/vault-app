<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <UCard>
        <template #header>
          <div class="text-center">
            <Icon name="mdi:alert-circle" class="h-12 w-12 text-red-500 mx-auto mb-2" />
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Error de autenticación
            </h2>
          </div>
        </template>

        <div class="text-center mb-6">
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Hubo un problema al intentar autenticarse con
            <span class="font-semibold capitalize">{{ provider }}</span>
          </p>
          <p class="text-sm text-gray-500">
            Por favor, intenta de nuevo o contacta con soporte si el problema persiste.
          </p>
        </div>

        <div class="space-y-2">
          <NuxtLink to="/login" class="w-full">
            <UButton block>
              Volver a intentar
            </UButton>
          </NuxtLink>
          <NuxtLink to="/" class="w-full">
            <UButton block variant="ghost">
              Ir a inicio
            </UButton>
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'minimal',
})

const route = useRoute()
const provider = computed(() => (route.query.provider as string) || 'desconocida')
</script>
