<script setup lang="ts">
import type { UserStats, Achievement } from '~/types'

useSeoMeta({
  title: 'Mi bóveda — Volt Vault',
})

const { user } = useAuthUser()

const { data: statsData } = await useFetch<{ success: boolean; data: UserStats }>('/api/me/stats')
const stats = computed<UserStats | null>(() => statsData.value?.data ?? null)

const { data: achievementsData } = await useFetch<{ success: boolean; data: Achievement[] }>('/api/me/achievements')
const achievements = computed<Achievement[]>(() => achievementsData.value?.data ?? [])
const unlockedAchievements = computed(() => achievements.value.filter((a) => a.unlocked).length)

const { data, pending, error } = await useFetch<{ success: boolean; total: number; data: Array<{
  id: string
  obtainedAt: string
  item: { id: string; name: string; slug: string; image: { url: string; alt: string | null } | null; collection: { name: string; slug: string } }
}> }>('/api/me/collection')

const items = computed(() => data.value?.data ?? [])

const xpPercent = computed(() => {
  const s = stats.value
  if (!s || !s.xpForNextLevel) return 0
  return Math.round((s.xpIntoLevel / s.xpForNextLevel) * 100)
})
</script>

<template>
  <div>
    <UContainer class="py-10 lg:py-14">
      <!-- Header -->
      <SectionHeading
        eyebrow="Bóveda personal"
        :title="user ? `Hola, ${user.name}` : 'Mi bóveda'"
        description="Estas son las piezas que has conseguido y tu progreso como coleccionista."
      />

      <!-- Progress + XP -->
      <div v-if="stats" class="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- Global ring -->
        <div class="flex items-center gap-4 rounded-2xl border border-default bg-muted p-5">
          <ProgressRing :percent="stats.percent" :size="96" label="global" />
          <div class="text-sm">
            <p class="font-display text-lg font-bold tabular-nums">{{ stats.collectedItems }} / {{ stats.totalItems }}</p>
            <p class="text-muted">conseguidos</p>
            <p class="mt-1 text-muted">{{ stats.completedCollections }} de {{ stats.collections }} colecciones completadas</p>
          </div>
        </div>

        <!-- Level + XP bar -->
        <div class="lg:col-span-2 flex flex-col justify-center gap-3 rounded-2xl border border-default bg-muted p-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-full bg-gold text-ink">
                <UIcon name="i-lucide-star" class="size-6" />
              </div>
              <div>
                <span class="label-caps text-gold">Nivel {{ stats.level }}</span>
                <p class="font-display text-lg font-bold tabular-nums">{{ stats.xp }} XP</p>
              </div>
            </div>
            <span class="label-caps text-muted">{{ stats.xpIntoLevel }} / {{ stats.xpForNextLevel }} XP</span>
          </div>
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-default">
            <div
              class="h-full rounded-full bg-gradient-to-r from-volt via-gold to-gold transition-[width] duration-700"
              :style="{ width: `${xpPercent}%` }"
            />
          </div>
          <p class="text-xs text-muted">Sube de nivel cada {{ stats.xpForNextLevel }} XP. Consigue piezas para ganar XP según su rareza.</p>
        </div>
      </div>

      <!-- Achievements -->
      <section v-if="achievements.length" class="mt-10">
        <div class="flex items-center justify-between">
          <SectionHeading eyebrow="Insignias" title="Logros" />
          <span class="label-caps text-muted">{{ unlockedAchievements }} / {{ achievements.length }}</span>
        </div>
        <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="a in achievements"
            :key="a.key"
            class="flex flex-col gap-2 rounded-2xl border p-4 transition-colors"
            :class="a.unlocked ? 'border-gold/40 bg-gold/5' : 'border-default bg-muted opacity-70'"
          >
            <div
              class="flex size-11 items-center justify-center rounded-full"
              :class="a.unlocked ? 'bg-gold text-ink' : 'bg-elevated text-muted'"
            >
              <UIcon :name="a.unlocked ? (a.icon ?? 'i-lucide-award') : 'i-lucide-lock'" class="size-5" />
            </div>
            <div>
              <p class="font-display font-bold">{{ a.name }}</p>
              <p class="text-xs text-muted">{{ a.description }}</p>
            </div>
            <span class="label-caps mt-auto" :class="a.unlocked ? 'text-gold' : 'text-muted'">+{{ a.xpReward }} XP</span>
          </div>
        </div>
      </section>

      <!-- Collected items -->
      <section class="mt-12">
        <SectionHeading eyebrow="Catálogo conseguido" title="Piezas en tu bóveda" />

        <div v-if="pending" class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <USkeleton v-for="i in 8" :key="i" class="h-56 rounded-2xl" />
        </div>

        <UAlert v-else-if="error" class="mt-6" color="error" title="Error al cargar tu colección" />

        <div v-else-if="items.length" class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <VaultCard
            v-for="entry in items"
            :key="entry.id"
            :to="`/collections/${entry.item.collection.slug}/${entry.item.slug}`"
          >
            <div class="aspect-square w-full overflow-hidden">
              <AppImage
                :src="entry.item.image?.url"
                :alt="entry.item.name"
                class="h-full w-full transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div class="p-4">
              <h3 class="line-clamp-1 font-display font-bold">{{ entry.item.name }}</h3>
              <p class="mt-0.5 text-xs text-muted">{{ entry.item.collection.name }}</p>
            </div>
          </VaultCard>
        </div>

        <UEmpty v-else class="mt-6" title="Aún no has conseguido nada" description="Explora las colecciones y empieza a completar la tuya.">
          <template #actions>
            <UButton to="/collections" icon="i-lucide-library">Ver colecciones</UButton>
          </template>
        </UEmpty>
      </section>
    </UContainer>
  </div>
</template>
