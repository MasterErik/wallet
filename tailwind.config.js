/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        secondary: '#1A1A1A',
        text: '#FFFFFF',
        hint: '#8E8E93',
        button: '#007AFF',
      }
    },
    container: {
      center: true,
    }
  },
  plugins: [],
}
