<template>
  <div :style="root">
    <div :style="header">
      <span :style="dot" />
      <span :style="eyebrow">VOLT VAULT · COLECCIÓN</span>
    </div>

    <div :style="body">
      <div :style="title">{{ name }}</div>
    </div>

    <div :style="footer">
      <div :style="rule" />
      <div :style="metaRow">
        <span :style="meta">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</span>
        <span :style="brand">La bóveda de coleccionables</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ name?: string; itemCount?: number }>(), {
  name: 'Colección',
  itemCount: 0,
})

// satori no lee CSS vars: valores de DESIGN.md centralizados aquí.
const C = { ink: '#0a1a2f', gold: '#ffd700', text: '#f8fafc', muted: '#94a3b8' } as const
const DISPLAY = 'Plus Jakarta Sans'
const SANS = 'Hanken Grotesk'

const root = {
  width: '1200px',
  height: '630px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '80px',
  backgroundColor: C.ink,
  backgroundImage: 'radial-gradient(circle at 85% 0%, rgba(255,215,0,0.14), transparent 45%), radial-gradient(circle at 0% 100%, rgba(30,144,255,0.16), transparent 45%)',
  fontFamily: SANS,
  color: C.text,
} as const
const header = { display: 'flex', alignItems: 'center', gap: '16px' } as const
const dot = { width: '16px', height: '16px', borderRadius: '9999px', backgroundColor: C.gold } as const
const eyebrow = { fontFamily: DISPLAY, fontWeight: 700, fontSize: '24px', letterSpacing: '6px', color: C.gold, textTransform: 'uppercase' } as const
const body = { display: 'flex', flexDirection: 'column', gap: '16px' } as const
const title = { fontFamily: DISPLAY, fontWeight: 800, fontSize: '84px', lineHeight: 1.05, letterSpacing: '-2px', color: C.text } as const
const footer = { display: 'flex', flexDirection: 'column', gap: '24px' } as const
const rule = { width: '160px', height: '6px', borderRadius: '9999px', backgroundColor: C.gold } as const
const metaRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const
const meta = { fontFamily: SANS, fontWeight: 600, fontSize: '32px', color: C.muted } as const
const brand = { fontFamily: SANS, fontWeight: 400, fontSize: '28px', color: C.muted } as const
</script>
