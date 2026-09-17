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
    // Navegación: mayúsculas y tracking de etiqueta (nav-elements 16px de radio).
    navigationMenu: {
      slots: {
        link: 'uppercase tracking-wide text-xs',
        label: 'uppercase tracking-wide text-[11px]',
      },
    },
    // Formularios: radios generosos (16px, nav-elements) y labels uppercase.
    input: {
      slots: {
        base: 'rounded-2xl',
      },
    },
    textarea: {
      slots: {
        base: 'rounded-2xl',
      },
    },
    select: {
      slots: {
        base: 'rounded-2xl',
      },
    },
    formField: {
      slots: {
        label: 'block uppercase tracking-wide text-[11px]',
      },
    },
  },
})
