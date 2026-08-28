<script setup lang="ts">
import CollectionGrid from '~/components/organisms/CollectionGrid.vue'

useSeoMeta({
  title: 'Colecciones — Volt Vault',
  description: 'Explora todas las colecciones de coleccionables impresos en 3D de Volt-3D.',
})

const { data, pending, error } = await useFetch('/api/collections')
const collections = computed(() => data.value?.data ?? [])
</script>

<template>
  <UPage>
    <UPageHero title="Colecciones" description="Explora y posee piezas únicas impresas en 3D por Volt-3D." />

    <UPageBody>
      <UContainer>
        <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <USkeleton v-for="i in 6" :key="i" class="h-64 rounded-lg" />
        </div>

        <UAlert v-else-if="error" color="error" title="Error al cargar colecciones" :description="(error as any)?.message" />

        <CollectionGrid v-else-if="collections.length" :collections="collections" />

        <UEmpty v-else title="No hay colecciones" description="Pronto se publicarán nuevas colecciones." />
      </UContainer>
    </UPageBody>
  </UPage>
</template>
