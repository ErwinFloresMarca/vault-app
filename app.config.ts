export default defineAppConfig({
  // Datos de marca usados por la interfaz (redes en sidebar y pie de página).
  volt: {
    // WhatsApp de ventas en formato internacional sin "+" (p. ej. '59170000000').
    // Vacío = se ocultan los botones de WhatsApp.
    whatsapp: '',
    social: [
      { label: 'Instagram', url: 'https://www.instagram.com/volt3d.bo/', icon: 'i-lucide-instagram' },
      { label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61589067363553', icon: 'i-lucide-facebook' },
      { label: 'TikTok', url: 'https://www.tiktok.com/@volt3d.bo', icon: 'tiktok' },
    ],
  },
  ui: {
    colors: {
      // Paletas definidas en assets/css/main.css (@theme static).
      primary: 'brand',
      secondary: 'volt',
      neutral: 'neutral',
    },
    // Botones: pill, tipografía display y negrita (DESIGN.md).
    button: {
      slots: {
        base: 'rounded-full font-display font-bold',
      },
    },
    // Badges/chips: pill compacta, sin mayúsculas forzadas (estilo MakerWorld).
    badge: {
      slots: {
        base: 'rounded-full font-display font-semibold',
      },
    },
    // Tarjetas: esquinas moderadas (rounded-xl = 0.75rem).
    card: {
      slots: {
        root: 'rounded-xl',
      },
    },
    // Inputs y controles: rounded-lg.
    input: { slots: { base: 'rounded-lg' } },
    textarea: { slots: { base: 'rounded-lg' } },
    select: { slots: { base: 'rounded-lg' } },
    formField: { slots: { label: 'label-caps text-default' } },
    navigationMenu: { slots: { link: 'font-display font-semibold' } },
  },
})
