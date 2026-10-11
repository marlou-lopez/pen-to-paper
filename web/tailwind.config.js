/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FBFBFA',
          100: '#F5F5F3',
          200: '#E9E9E5',
          300: '#D6D6CF',
          800: '#222220',
          900: '#141413',
        }
      }
    },
  },
  plugins: [],
}
