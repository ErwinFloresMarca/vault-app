export default defineAppConfig({
  ui: {
    colors: {
      // Paletas definidas en assets/css/main.css (@theme static).
      primary: 'gold',
      secondary: 'volt',
      neutral: 'slate',
    },
    // Botones: pill, tipografía display y negrita (DESIGN.md).
    button: {
      slots: {
        base: 'rounded-full font-display font-bold',
      },
    },
    // Badges/chips: pill + etiqueta técnica (label-caps).
    badge: {
      slots: {
        base: 'rounded-full font-display font-bold uppercase tracking-wider',
      },
    },
    // Tarjetas: enclosures grandes (rounded-2xl = 3rem).
    card: {
      slots: {
        root: 'rounded-2xl',
      },
    },
    // Inputs y controles: rounded-xl (2rem) según DESIGN.md.
    input: { slots: { base: 'rounded-xl' } },
    textarea: { slots: { base: 'rounded-xl' } },
    select: { slots: { base: 'rounded-xl' } },
    formField: { slots: { label: 'label-caps text-default' } },
    navigationMenu: { slots: { link: 'font-display font-semibold' } },
  },
})
