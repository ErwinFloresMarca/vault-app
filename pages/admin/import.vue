<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type {
  MakerworldBatchItemResult,
  MakerworldBatchResult,
  MakerworldPreviewItem,
  MakerworldResolveResult,
} from '~/types'

useSeoMeta({ title: 'Importar — Volt Vault Admin' })

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface CollectionOption {
  id: string
  name: string
  slug: string
  _count?: { items: number }
}

const { data: collectionsData, refresh: refreshCollections } = await useFetch<{ success: boolean; data: CollectionOption[] }>('/api/admin/collections')

const collections = computed<CollectionOption[]>(() => collectionsData.value?.data ?? [])
const collectionOptions = computed(() => collections.value.map((collection) => ({
  label: `${collection.name}${collection._count ? ` · ${countLabel(collection._count.items, 'item', 'items')}` : ''}`,
  value: collection.id,
})))

const sourceUrl = ref('')
const analyzing = ref(false)
const analyzeError = ref('')
const resolved = ref<MakerworldResolveResult | null>(null)

const targetMode = ref<'new' | 'existing'>('new')
const newName = ref('')
const newDescription = ref('')
const existingCollectionId = ref('')
const itemStatus = ref<'DRAFT' | 'AVAILABLE'>('DRAFT')
const collectionStatus = ref<'DRAFT' | 'PUBLISHED'>('DRAFT')
const updateExisting = ref(false)

const selectedIds = ref<number[]>([])
const importing = ref(false)
const progress = ref(0)
const importError = ref('')
const importDone = ref(false)
const results = ref<MakerworldBatchItemResult[]>([])
const targetCollectionId = ref('')
const targetCollectionSlug = ref('')

const previewColumns: TableColumn<MakerworldPreviewItem>[] = [
  { id: 'select', header: 'Importar' },
  { id: 'title', header: 'Modelo' },
  { id: 'author', header: 'Autor' },
  { id: 'existing', header: 'Estado' },
]

const resultColumns: TableColumn<MakerworldBatchItemResult>[] = [
  { accessorKey: 'id', header: 'Modelo' },
  { accessorKey: 'action', header: 'Resultado' },
  { accessorKey: 'license', header: 'Licencia' },
]

const allSelected = computed(() => !!resolved.value && selectedIds.value.length === resolved.value.items.length)
const canImport = computed(() => {
  if (!resolved.value || selectedIds.value.length === 0) return false
  return targetMode.value === 'existing' ? !!existingCollectionId.value : !!newName.value.trim()
})

const summary = computed(() => {
  const created = results.value.filter((item) => item.action === 'created').length
  const updated = results.value.filter((item) => item.action === 'updated').length
  const skipped = results.value.filter((item) => item.action === 'skipped').length
  const errors = results.value.filter((item) => item.action === 'error').length
  return { created, updated, skipped, errors }
})

const licenses = computed(() => {
  const counts = new Map<string, number>()
  for (const item of results.value) {
    if (item.license) counts.set(item.license, (counts.get(item.license) ?? 0) + 1)
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }))
})

function apiMessage(error: unknown): string {
  const candidate = error as {
    data?: { statusMessage?: string; message?: string }
    statusMessage?: string
    message?: string
  }
  return candidate?.data?.statusMessage
    ?? candidate?.data?.message
    ?? candidate?.statusMessage
    ?? candidate?.message
    ?? 'Error inesperado'
}

function actionLabel(action: MakerworldBatchItemResult['action']): string {
  return {
    created: 'Creado',
    updated: 'Actualizado',
    skipped: 'Omitido',
    error: 'Error',
  }[action]
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function resetAnalysis() {
  resolved.value = null
  selectedIds.value = []
  results.value = []
  importError.value = ''
  importDone.value = false
  targetCollectionId.value = ''
  targetCollectionSlug.value = ''
  progress.value = 0
}

async function analyze() {
  if (!sourceUrl.value.trim()) return
  analyzing.value = true
  analyzeError.value = ''
  resetAnalysis()

  try {
    const response = await $fetch<{ success: boolean; data: MakerworldResolveResult }>(
      '/api/admin/import/makerworld/resolve',
      { method: 'POST', body: { url: sourceUrl.value } },
    )
    resolved.value = response.data
    selectedIds.value = response.data.items.map((item) => item.id)
    newName.value = response.data.suggestedCollectionName
    newDescription.value = response.data.suggestedCollectionDescription ?? ''
    existingCollectionId.value = collections.value[0]?.id ?? ''
    targetMode.value = 'new'
  } catch (error) {
    analyzeError.value = apiMessage(error)
  } finally {
    analyzing.value = false
  }
}

function toggleItem(id: number, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id]
  } else {
    selectedIds.value = selectedIds.value.filter((value) => value !== id)
  }
}

function toggleAll(checked: boolean | 'indeterminate') {
  selectedIds.value = checked === true && resolved.value ? resolved.value.items.map((item) => item.id) : []
}

async function importAll() {
  if (!canImport.value || !resolved.value) return
  importing.value = true
  importError.value = ''
  importDone.value = false
  results.value = []
  progress.value = 0

  const ids = [...selectedIds.value]
  const chunkSize = 20
  let collectionId = targetMode.value === 'existing' ? existingCollectionId.value : ''
  let collectionSlug = collectionId
    ? collections.value.find((collection) => collection.id === collectionId)?.slug ?? ''
    : ''

  try {
    for (let index = 0; index < ids.length; index += chunkSize) {
      const chunk = ids.slice(index, index + chunkSize)
      const body = {
        modelIds: chunk,
        itemStatus: itemStatus.value,
        collectionStatus: collectionStatus.value,
        updateExisting: updateExisting.value,
        setCollectionCover: targetMode.value === 'new',
        ...(collectionId
          ? { collectionId }
          : {
              newCollection: {
                name: newName.value.trim(),
                description: newDescription.value.trim() || undefined,
              },
            }),
      }

      const response = await $fetch<{ success: boolean; data: MakerworldBatchResult }>(
        '/api/admin/import/makerworld/batch',
        { method: 'POST', body },
      )

      collectionId = response.data.collectionId
      collectionSlug = response.data.collectionSlug
      targetCollectionId.value = collectionId
      targetCollectionSlug.value = collectionSlug
      results.value = [...results.value, ...response.data.items]
      progress.value = Math.round(((index + chunk.length) / ids.length) * 100)
    }

    importDone.value = true
    await refreshCollections()
  } catch (error) {
    importError.value = apiMessage(error)
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Importar desde MakerWorld" />
    </template>
    <template #body>
    <UContainer class="min-w-0 space-y-6">
      <UAlert
        color="warning"
        icon="i-lucide-scale"
        title="Verifica la licencia antes de vender"
        description="MakerWorld permite modelos con licencias distintas. La licencia estándar (Standard Digital File License) prohíbe vender las impresiones. Volt Vault guarda el autor, la licencia y el enlace al original en cada item, pero la responsabilidad de comprobarla es tuya."
      />

      <UPageCard class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
        <form class="flex flex-col gap-4 lg:flex-row lg:items-end" @submit.prevent="analyze">
          <UFormField label="URL de MakerWorld" class="flex-1" help="Colección (/collections/{id}) o modelo (/models/{id})">
            <UInput
              v-model="sourceUrl"
              placeholder="https://makerworld.com/en/collections/25945428-printed-already"
              icon="i-lucide-link"
              autocomplete="off"
            />
          </UFormField>
          <UButton
            type="submit"
            icon="i-lucide-search"
            label="Analizar"
            :loading="analyzing"
            :disabled="!sourceUrl.trim()"
          />
        </form>
      </UPageCard>

      <UAlert v-if="analyzeError" color="error" icon="i-lucide-circle-alert" title="No se pudo analizar" :description="analyzeError" />

      <div v-if="analyzing" class="flex justify-center py-10">
        <USkeleton class="h-48 w-full rounded-xl" />
      </div>

      <template v-if="resolved && !analyzing">
        <UPageCard class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
          <div class="flex flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <UIcon name="i-lucide-library" class="size-5 text-[var(--color-gold)]" />
              <h2 class="font-display text-xl font-bold">{{ resolved.source.title }}</h2>
              <UBadge color="neutral" variant="subtle">{{ resolved.source.total }} {{ resolved.source.total === 1 ? 'modelo' : 'modelos' }}</UBadge>
              <UBadge v-if="resolved.source.type === 'collection'" color="primary" variant="subtle">Colección</UBadge>
              <UBadge v-else color="primary" variant="subtle">Modelo individual</UBadge>
            </div>
            <p class="text-sm text-muted">
              {{ countLabel(selectedIds.length, 'seleccionado', 'seleccionados') }}.
              <span v-if="resolved.items.some(item => item.existing)">Los items marcados como “Ya importado” se omiten salvo que actives “Actualizar”.</span>
            </p>
          </div>
        </UPageCard>

        <UPageCard class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
          <div class="space-y-5">
            <div class="flex flex-col gap-2">
              <span class="label-caps text-muted">Destino</span>
              <URadioGroup
                v-model="targetMode"
                :items="[
                  { label: 'Crear una colección nueva', value: 'new' },
                  { label: 'Usar una colección existente', value: 'existing' },
                ]"
              />
            </div>

            <div v-if="targetMode === 'new'" class="grid gap-4 md:grid-cols-2">
              <UFormField label="Nombre de la colección">
                <UInput v-model="newName" placeholder="Ej.: Impresos de MakerWorld" />
              </UFormField>
              <UFormField label="Descripción (opcional)">
                <UInput v-model="newDescription" placeholder="Descripción breve" />
              </UFormField>
            </div>

            <UFormField v-else label="Colección existente">
              <USelect v-model="existingCollectionId" :items="collectionOptions" placeholder="Selecciona una colección" />
            </UFormField>

            <div class="grid gap-4 md:grid-cols-3">
              <UFormField label="Estado de los items">
                <USelect
                  v-model="itemStatus"
                  :items="[
                    { label: 'Borrador (revisar antes)', value: 'DRAFT' },
                    { label: 'Disponible', value: 'AVAILABLE' },
                  ]"
                />
              </UFormField>
              <UFormField v-if="targetMode === 'new'" label="Estado de la colección">
                <USelect
                  v-model="collectionStatus"
                  :items="[
                    { label: 'Borrador', value: 'DRAFT' },
                    { label: 'Publicada', value: 'PUBLISHED' },
                  ]"
                />
              </UFormField>
              <div class="flex items-end pb-1">
                <UCheckbox v-model="updateExisting" label="Actualizar items ya importados" />
              </div>
            </div>
          </div>
        </UPageCard>

        <UPageCard class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <UCheckbox
                :model-value="allSelected"
                label="Seleccionar todos"
                @update:model-value="toggleAll"
              />
              <UBadge color="neutral" variant="subtle">{{ selectedIds.length }}/{{ resolved.items.length }}</UBadge>
            </div>
            <UButton
              icon="i-lucide-cloud-download"
              :label="`Importar ${countLabel(selectedIds.length, 'modelo', 'modelos')}`"
              :loading="importing"
              :disabled="!canImport || importing"
              @click="importAll"
            />
          </div>

          <div class="min-w-0 overflow-x-auto">
          <UTable :data="resolved.items" :columns="previewColumns" :empty="'No hay modelos'">
            <template #select-cell="{ row }">
              <UCheckbox
                :model-value="selectedIds.includes(row.original.id)"
                :aria-label="`Seleccionar ${row.original.title}`"
                @update:model-value="checked => toggleItem(row.original.id, checked === true)"
              />
            </template>
            <template #title-cell="{ row }">
              <div class="flex min-w-0 items-center gap-3">
                <div class="size-11 shrink-0 overflow-hidden rounded-lg border border-default bg-elevated">
                  <AppImage
                    v-if="row.original.coverUrl"
                    :src="row.original.coverUrl"
                    :alt="row.original.title"
                    :width="80"
                    :height="80"
                    class="h-full w-full"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <UIcon name="i-lucide-image" class="size-4 text-muted" />
                  </div>
                </div>
                <div class="flex min-w-0 flex-col">
                  <a
                    :href="row.original.sourceUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="truncate font-display font-semibold hover:underline"
                  >
                    {{ row.original.title }}
                  </a>
                  <span class="label-caps text-muted">#{{ row.original.id }}</span>
                </div>
              </div>
            </template>
            <template #author-cell="{ row }">
              <span
                v-if="row.original.creator"
                class="block max-w-[220px] truncate text-sm"
                :title="`${row.original.creator.name} @${row.original.creator.handle}`"
              >
                {{ row.original.creator.name }}
                <span class="text-muted">@{{ row.original.creator.handle }}</span>
              </span>
              <span v-else class="text-muted">—</span>
            </template>
            <template #existing-cell="{ row }">
              <UBadge v-if="row.original.existing" color="success" variant="subtle">
                Ya importado · {{ row.original.existing.collectionName }}
              </UBadge>
              <UBadge v-else color="neutral" variant="subtle">Nuevo</UBadge>
            </template>
          </UTable>
          </div>

          <div v-if="importing || progress > 0" class="mt-5 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Importando…</span>
              <span class="font-display font-bold">{{ progress }}%</span>
            </div>
            <UProgress :model-value="progress" />
          </div>
        </UPageCard>

        <UAlert v-if="importError" color="error" icon="i-lucide-circle-alert" title="La importación se detuvo" :description="importError" />

        <UPageCard v-if="importDone" class="min-w-0" :ui="{ container: 'min-w-0', body: 'min-w-0' }">
          <div class="space-y-5">
            <div class="flex flex-wrap items-center gap-3">
              <UIcon name="i-lucide-circle-check" class="size-6 text-[var(--color-success)]" />
              <h2 class="font-display text-xl font-bold">Importación terminada</h2>
            </div>

            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="rounded-lg border border-default p-3">
                <span class="label-caps text-muted">Creados</span>
                <p class="font-display text-2xl font-bold">{{ summary.created }}</p>
              </div>
              <div class="rounded-lg border border-default p-3">
                <span class="label-caps text-muted">Actualizados</span>
                <p class="font-display text-2xl font-bold">{{ summary.updated }}</p>
              </div>
              <div class="rounded-lg border border-default p-3">
                <span class="label-caps text-muted">Omitidos</span>
                <p class="font-display text-2xl font-bold">{{ summary.skipped }}</p>
              </div>
              <div class="rounded-lg border border-default p-3">
                <span class="label-caps text-muted">Errores</span>
                <p class="font-display text-2xl font-bold" :class="{ 'text-[var(--color-error)]': summary.errors > 0 }">{{ summary.errors }}</p>
              </div>
            </div>

            <div v-if="licenses.length" class="rounded-lg border border-default p-3">
              <span class="label-caps text-muted">Licencias detectadas</span>
              <ul class="mt-2 space-y-1 text-sm">
                <li v-for="license in licenses" :key="license.name">
                  <span class="font-semibold">{{ license.name }}</span>
                  <span class="text-muted"> · {{ countLabel(license.count, 'modelo', 'modelos') }}</span>
                </li>
              </ul>
            </div>

            <div class="min-w-0 overflow-x-auto">
            <UTable v-if="results.length" :data="results" :columns="resultColumns">
              <template #action-cell="{ row }">
                <UBadge
                  :color="row.original.action === 'created' ? 'success' : row.original.action === 'updated' ? 'primary' : row.original.action === 'error' ? 'error' : 'neutral'"
                  variant="subtle"
                >
                  {{ actionLabel(row.original.action) }}
                </UBadge>
              </template>
              <template #license-cell="{ row }">
                <span class="text-sm text-muted">{{ row.original.license ?? (row.original.error || '—') }}</span>
              </template>
            </UTable>
            </div>

            <div class="flex flex-wrap gap-2">
              <UButton
                v-if="targetCollectionId && targetCollectionSlug"
                icon="i-lucide-external-link"
                label="Ver colección"
                :to="`/collections/${targetCollectionSlug}`"
                target="_blank"
              />
              <UButton
                icon="i-lucide-arrow-right"
                color="neutral"
                variant="outline"
                label="Ir a colecciones"
                to="/admin/collections"
              />
            </div>
          </div>
        </UPageCard>
      </template>
    </UContainer>
    </template>
  </UDashboardPanel>
</template>
