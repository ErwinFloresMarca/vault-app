<template>
  <div class="flex flex-col gap-1" :class="center ? 'items-center text-center' : ''">
    <div class="flex items-center gap-2">
      <span class="h-4 w-1.5 shrink-0 rounded-full bg-primary" />
      <span class="label-caps text-primary">{{ eyebrow }}</span>
    </div>
    <h2 class="font-display text-headline font-bold tracking-tight">{{ title }}</h2>
    <p v-if="description" class="max-w-2xl text-muted">{{ description }}</p>
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
