/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fp: {
          // Warm muted accent (sage/olive)
          accent:    '#7c8c6e',     // Muted sage green — primary accent
          'accent-light': '#9aab8a',
          // Functional muted tones
          success:   '#7c8c6e',     // Same sage for positive/success
          warning:   '#c4956a',     // Warm terracotta/clay
          danger:    '#b07070',     // Dusty rose/muted red
          info:      '#8a9bae',     // Cool steel blue (soft)
          muted:     '#a0937d',     // Warm taupe
          // Backgrounds — warm dark neutrals
          bg:        '#1a1a18',     // Near-black with warm undertone
          card:      '#222220',     // Card surface
          sidebar:   '#1c1c1a',    // Sidebar surface
          surface:   '#2a2a27',     // Elevated surface
          border:    '#333330',     // Border tone
          'border-light': '#3d3d39',
        }
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.2)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
