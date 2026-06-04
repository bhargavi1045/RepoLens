/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:            '#0a0a0a',
          card:          '#0d0d0d',
          panel:         '#111111',
          border:        '#1e1e1e',
          borderHover:   '#333333',
          input:         '#111111',
          hover:         '#161616',
          text:          '#e0e0e0',
          textMuted:     '#888888',
          textDim:       '#555555',
          white:         '#ffffff',
          error:         '#e03535',
          errorLight:    '#ff5555',
          success:       '#35c070',
          warning:       '#888888',
        },
      },
      fontFamily: {
        mono: "'JetBrains Mono', monospace",
      },
    },
  },
  plugins: [],
}