<template>
  <div :style="root">
    <div :style="header">
      <span :style="dot" />
      <span :style="eyebrow">VOLT VAULT</span>
    </div>

    <div :style="body">
      <div :style="title">{{ label }}</div>
      <div :style="subtitle">Coleccionables de edición limitada</div>
    </div>

    <div :style="footer">
      <div :style="rule" />
      <div :style="brandRow">
        <span :style="brand">volt.volt-3d.store</span>
        <span :style="brand">Descubre · Consigue · Completa</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), {
  label: 'Volt Vault',
})

const C = { ink: '#0a1a2f', gold: '#ffd700', volt: '#1e90ff', text: '#f8fafc', muted: '#94a3b8' } as const
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
  backgroundImage: 'radial-gradient(circle at 15% 0%, rgba(30,144,255,0.18), transparent 45%), radial-gradient(circle at 100% 100%, rgba(255,215,0,0.14), transparent 45%)',
  fontFamily: SANS,
  color: C.text,
} as const
const header = { display: 'flex', alignItems: 'center', gap: '16px' } as const
const dot = { width: '16px', height: '16px', borderRadius: '9999px', backgroundColor: C.volt } as const
const eyebrow = { fontFamily: DISPLAY, fontWeight: 700, fontSize: '24px', letterSpacing: '6px', color: C.volt, textTransform: 'uppercase' } as const
const body = { display: 'flex', flexDirection: 'column', gap: '20px' } as const
const title = { fontFamily: DISPLAY, fontWeight: 800, fontSize: '92px', lineHeight: 1.02, letterSpacing: '-2px', color: C.text } as const
const subtitle = { fontFamily: SANS, fontWeight: 400, fontSize: '36px', color: C.muted } as const
const footer = { display: 'flex', flexDirection: 'column', gap: '24px' } as const
const rule = { width: '160px', height: '6px', borderRadius: '9999px', backgroundColor: C.gold } as const
const brandRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as const
const brand = { fontFamily: SANS, fontWeight: 400, fontSize: '28px', color: C.muted } as const
</script>
