/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#a5b4fc',
        // Custom gray palette - change these to switch between slate/zinc/neutral/stone
        gray: {
          50: '#fafafa',   // zinc-50
          100: '#f4f4f5',  // zinc-100
          200: '#e4e4e7',  // zinc-200
          300: '#d4d4d8',  // zinc-300
          400: '#a1a1aa',  // zinc-400
          500: '#71717a',  // zinc-500
          600: '#52525b',  // zinc-600
          700: '#3f3f46',  // zinc-700
          800: '#27272a',  // zinc-800
          900: '#18181b',  // zinc-900
          950: '#09090b',  // zinc-950
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

