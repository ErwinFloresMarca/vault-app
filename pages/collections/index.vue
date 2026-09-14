<script setup lang="ts">
import CollectionGrid from '~/components/organisms/CollectionGrid.vue'
import type { CollectionSummary, TagDto } from '~/types'

useSeoMeta({
  title: 'Colecciones — Volt Vault',
  description: 'Explora todas las colecciones de coleccionables impresos en 3D de Volt-3D.',
})

const search = ref('')
const debouncedSearch = ref('')
const selectedTag = ref('all')
const page = ref(1)

const query = computed(() => ({
  q: debouncedSearch.value || undefined,
  tag: selectedTag.value !== 'all' ? selectedTag.value : undefined,
  page: page.value,
}))

const { data, pending, error } = await useFetch<{
  success: boolean
  data: CollectionSummary[]
  total: number
  page: number
  pageSize: number
}>('/api/collections', { query })

const collections = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const pageSize = computed(() => data.value?.pageSize ?? 12)

const { data: tagsData } = await useFetch<{ success: boolean; data: TagDto[] }>('/api/tags')
const tagItems = computed(() => [
  { label: 'Todas las etiquetas', value: 'all' },
  ...(tagsData.value?.data ?? []).map((t) => ({ label: t.name, value: t.slug })),
])

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value
    page.value = 1
  }, 300)
})
watch(selectedTag, () => { page.value = 1 })
</script>

<template>
  <UPage>
    <UPageHero title="Colecciones" description="Explora y posee piezas únicas impresas en 3D por Volt-3D." />

    <UPageBody>
      <UContainer>
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Buscar colección..."
            class="w-full sm:max-w-xs"
          />
          <USelect v-model="selectedTag" :items="tagItems" class="w-full sm:w-60" />
        </div>

        <div v-if="pending" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <USkeleton v-for="i in 6" :key="i" class="h-64 rounded-lg" />
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          title="Error al cargar colecciones"
          :description="(error as { message?: string })?.message"
        />

        <CollectionGrid v-else-if="collections.length" :collections="collections" />

        <UEmpty
          v-else
          title="Sin resultados"
          description="No hay colecciones que coincidan con tu búsqueda."
        />

        <div v-if="total > pageSize" class="mt-8 flex justify-center">
          <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
        </div>
      </UContainer>
    </UPageBody>
  </UPage>
</template>
