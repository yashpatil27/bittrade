/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strike-inspired color palette (dark theme)
        brand: '#ffd4d4', // Strike's pink accent color
        accent: '#ffd4d4', // Strike's toggle accent color (use sparingly)
        primary: '#fff',   // Primary text (white)
        secondary: '#bfbfbf', // Secondary text (light gray)
        
        // Background colors
        'bg-primary': '#1e1e1e',   // Main background
        'bg-secondary': '#2e2e2e', // Card/container background
        'bg-tertiary': '#3e3e3e',  // Hover states
        
        // Button colors
        'btn-primary': '#fff',     // Primary button background
        'btn-primary-text': '#000', // Primary button text
        'btn-primary-hover': '#e6e6e6', // Primary button hover
        'btn-secondary': '#2e2e2e', // Secondary button background
        'btn-secondary-hover': '#3e3e3e', // Secondary button hover
        
        // Border and separator colors
        border: '#1e1e1e',
        separator: '#1e1e1e',
        
        // Keep original gray scale for compatibility
        gray: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

