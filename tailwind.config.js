/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // teal-ish "sea" + warm sand, like the Monastir coast
        brand: {
          50: '#eefbf8', 100: '#d5f4ee', 200: '#ade8dd', 300: '#78d4c6', 400: '#45b9ab',
          500: '#279d90', 600: '#1c7e75', 700: '#1a655f', 800: '#19514d', 900: '#184441',
        },
        sand: { 50: '#fbf8f3', 100: '#f5eee2', 200: '#eadbc2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .35s ease-out both' },
    },
  },
  plugins: [],
}
