<script setup lang="ts">
import CollectionGrid from '~/components/organisms/CollectionGrid.vue'
import type { CollectionSummary, TagDto, UserStats } from '~/types'

useSeoMeta({
  title: 'Colecciones — Volt Vault',
  description: 'Explora todas las series oficiales, filtra por etiqueta y supervisa el progreso de tu vitrina.',
})

const search = ref('')
const debouncedSearch = ref('')
const selectedTag = ref('all')
const sort = ref('featured')
const page = ref(1)

const sortItems = [
  { label: 'Destacados', value: 'featured' },
  { label: 'Nombre A-Z', value: 'name' },
  { label: 'Más recientes', value: 'recent' },
]

const query = computed(() => ({
  q: debouncedSearch.value || undefined,
  tag: selectedTag.value !== 'all' ? selectedTag.value : undefined,
  sort: sort.value,
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

const config = useRuntimeConfig()
const canonical = computed(() => `${config.public.siteUrl}/collections`)

useSeoMeta({
  ogTitle: 'Colecciones — Volt Vault',
  ogType: 'website',
  ogUrl: canonical,
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })

defineOgImage('VoltVaultGeneric', { label: 'Todas las colecciones' })

const { data: tagsData } = await useFetch<{ success: boolean; data: TagDto[] }>('/api/tags')
const tags = computed(() => tagsData.value?.data ?? [])

const { isAuthenticated } = useAuthUser()
const { data: meStats } = await useFetch<{ success: boolean; data: UserStats }>('/api/me/stats', {
  key: 'me:stats',
  immediate: isAuthenticated.value,
})

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value
    page.value = 1
  }, 300)
})
watch(selectedTag, () => { page.value = 1 })
watch(sort, () => { page.value = 1 })
</script>

<template>
  <div class="relative">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-24 left-1/4 size-96 rounded-full bg-volt/10 blur-[120px]" />
      <div class="absolute right-10 top-48 size-80 rounded-full bg-gold/10 blur-[140px]" />
    </div>

    <UContainer class="relative py-10 lg:py-14">
      <!-- Header -->
      <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Archivo de bóveda global"
          title="Colecciones"
          description="Explora todas las series oficiales, filtra por universo temático y supervisa el progreso de tu vitrina."
        />
        <div class="inline-flex items-center gap-2 self-start rounded-full border border-default bg-muted px-3 py-1.5 md:self-auto">
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-volt opacity-75" />
            <span class="relative inline-flex size-2 rounded-full bg-volt" />
          </span>
          <span class="label-caps text-volt">{{ total }} {{ total === 1 ? 'serie activa' : 'series activas' }}</span>
        </div>
      </header>

      <!-- Sticky filter console -->
      <section class="sticky top-16 z-30 py-4">
        <div class="flex flex-col gap-4 rounded-2xl border border-default bg-default/90 p-3 shadow-tier2 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-1">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Buscar colección..."
              class="w-full sm:max-w-xs"
            />
            <div class="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                class="label-caps shrink-0 rounded-full px-3 py-1.5 transition-colors"
                :class="selectedTag === 'all' ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-default'"
                @click="selectedTag = 'all'"
              >
                Todas
              </button>
              <button
                v-for="tag in tags"
                :key="tag.id"
                type="button"
                class="label-caps shrink-0 rounded-full px-3 py-1.5 transition-colors"
                :class="selectedTag === tag.slug ? 'bg-primary text-inverted' : 'bg-elevated text-muted hover:text-default'"
                @click="selectedTag = tag.slug"
              >
                #{{ tag.name }}
              </button>
            </div>
          </div>

          <div class="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
            <div class="flex items-center gap-2">
              <span class="hidden text-sm text-muted sm:inline">Ordenar:</span>
              <USelect v-model="sort" :items="sortItems" class="w-40" />
            </div>
            <div class="hidden h-4 w-px bg-accented lg:block" />
            <div class="label-caps hidden items-center gap-1.5 rounded-full bg-elevated px-3 py-1.5 lg:flex">
              <span class="text-primary">{{ total }}</span>
              <span class="text-muted">colecciones</span>
            </div>
          </div>
        </div>
      </section>

      <div v-if="pending" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="i in 6" :key="i" class="h-72 rounded-2xl" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        title="Error al cargar colecciones"
        :description="(error as { message?: string }).message"
      />

      <CollectionGrid v-else-if="collections.length" :collections="collections" />

      <UEmpty
        v-else
        title="Sin resultados"
        description="No hay colecciones que coincidan con tu búsqueda."
      />

      <div v-if="total > pageSize" class="mt-10 flex justify-center">
        <UPagination v-model:page="page" :total="total" :items-per-page="pageSize" />
      </div>

      <!-- Personal vault micro-banner -->
      <aside class="mx-auto mt-10 flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-default bg-muted p-4">
        <div class="flex items-center gap-3">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-full bg-elevated text-gold">
            <UIcon name="i-lucide-refresh-cw" class="size-5" />
          </div>
          <div class="flex flex-col">
            <template v-if="isAuthenticated && meStats">
              <span class="font-display text-sm font-semibold">Bóveda personal enlazada</span>
              <span class="label-caps text-muted">
                {{ meStats.data.collectedItems }} de {{ meStats.data.totalItems }} piezas ({{ meStats.data.percent }}%)
              </span>
            </template>
            <template v-else>
              <span class="font-display text-sm font-semibold">Bóveda personal sin enlazar</span>
              <span class="label-caps text-muted">Inicia sesión para seguir tu progreso</span>
            </template>
          </div>
        </div>
        <UButton :to="isAuthenticated ? '/me' : '/login'" color="neutral" variant="subtle" size="sm">
          {{ isAuthenticated ? 'Gestionar' : 'Iniciar sesión' }}
        </UButton>
      </aside>
    </UContainer>
  </div>
</template>
