<template>
  <div class="flex flex-col gap-1" :class="center ? 'items-center text-center' : ''">
    <span class="label-caps text-primary">{{ eyebrow }}</span>
    <h2 class="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{{ title }}</h2>
    <p v-if="description" class="max-w-2xl text-sm text-muted">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  eyebrow: string
  title: string
  description?: string
  center?: boolean
}>(), {
  description: '',
  center: false,
})
</script>
