# Spec: Módulo 15 — Gamificación (XP, niveles e insignias)

> Parte de la Fase 5 de `m13-redesign-ui.md` (`SEL-111`). Es el mayor alcance nuevo:
> da recompensa y progresión al acto de coleccionar.

## Objetivo

Que conseguir piezas otorgue **XP** según la rareza, suba de **nivel** al usuario y
desbloquee **insignias** (logros) que se muestran en su bóveda personal (`/me`).

## Supuestos / reglas

1. **XP por rareza** (por pieza conseguida): Común 50 · Rara 150 · Épica 350 · Legendaria 1000.
2. **Nivel** = `floor(xp / 500) + 1` (subida cada 500 XP).
3. **Bonus de colección completada**: +500 XP (una vez por colección).
4. El XP se **acumula/descuenta** al conseguir/des-conseguir; el bonus de colección se
   otorga al completarla y se **retira** si se des-completa (para no dejar XP fantasma).
5. Las insignias son **definiciones en BD** (seed) y se desbloquean de forma idempotente
   al superar su condición; otorgan XP extra una sola vez.
6. Todo el cálculo vive en el **servidor**; el cliente solo pinta.

## Modelo

- `User.xp Int @default(0)` (+ relación `achievements`).
- `Achievement` (`key` único, `name`, `description`, `icon`, `xpReward`, `sortOrder`).
- `UserAchievement` (`userId`, `achievementId`, `unlockedAt`, único por par).

## Insignias iniciales (seed)

- `first-item` — Primera pieza (+100). Condición: `collected >= 1`.
- `collector-10` — Coleccionista (+250). `collected >= 10`.
- `collection-complete` — Maestro de serie (+500). `completedCollections >= 1`.
- `legendary-owner` — Cazador de legendarias (+400). Tiene ≥1 pieza LEGENDARY.

## Requisitos (RFC-2119)

- Conseguir/des-conseguir un item **MUST** ajustar el XP del usuario atómicamente.
- El servidor **MUST** evaluar y desbloquear insignias tras cada cambio.
- `GET /api/me/stats` **MUST** incluir `xp`, `level`, `xpIntoLevel`, `xpForNextLevel`.
- `GET /api/me/achievements` **MUST** devolver todas las insignias con estado `unlocked`.
- `/me` **MUST** mostrar barra de XP + nivel e insignias (bloqueadas/desbloqueadas).
- La sección "Sistema de rarezas" del inicio **MUST** mostrar el XP real por tier.
- **MUST NOT** duplicar el desbloqueo (idempotente) ni otorgar XP negativo por debajo de 0.

## Criterios de aceptación

- Conseguir una Épica suma 350 XP y refleja el nivel en `/me`.
- Completar una colección desbloquea `collection-complete` y suma su bonus.
- `eslint`, `typecheck`, e2e y Playwright en verde; sin errores de consola.

## Boundaries

- **Always**: XP e insignias derivados en servidor; migración versionada; textos sin fabricación.
- **Ask first**: cambiar valores de XP/niveles o añadir insignias nuevas (producto).

## Estado

- **☑ Implementado** `SEL-122`. Migración `20261001032151_add_gamification`; `User.xp`,
  `Achievement` y `UserAchievement`; `gamificationService.recompute` (idempotente) en
  `collect`/`uncollect`; `/api/me/stats` (xp/nivel) y `/api/me/achievements`; UI en `/me`
  (barra de XP + insignias) y XP real en la sección de rarezas del inicio. Toast de XP al
  conseguir. Verificado con API (Épica 350, bonus +500) y Playwright; e2e 9/9; eslint/typecheck 0.
