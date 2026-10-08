/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#050508',
        'carbon': '#121215',
        'carbon-light': '#1a1a20',
        'neon-cyan': '#00f3ff',
        'neon-magenta': '#ff00ff',
        'nitrous-blue': '#0a44ff',
        'danger-red': '#ff1111',
        'amber': '#ff9900',
        'acid-green': '#39ff14',
      },
      fontFamily: {
        'heading': ['Impact', 'Arial Black', 'sans-serif'],
        'plate': ['Consolas', 'Courier New', 'monospace'],
        'body': ['Segoe UI', 'Helvetica Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
