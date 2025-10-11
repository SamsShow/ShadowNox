/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'shadow-dark': '#0a0a0a',
        'shadow-gray': '#1a1a1a',
        'shadow-accent': '#4a5568'
      }
    },
  },
  plugins: [],
}

