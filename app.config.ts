export default defineAppConfig({
  ui: {
    colors: {
      // Paleta definida en assets/css/main.css (@theme), derivada de DESIGN.md.
      primary: 'volt',
    },
    // DESIGN.md: pills con radius 9999px, tipografía uppercase y peso único 400.
    button: {
      slots: {
        base: 'rounded-full font-normal uppercase tracking-wide',
      },
    },
    badge: {
      slots: {
        base: 'rounded-full font-normal uppercase',
      },
    },
  },
})
