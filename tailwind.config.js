/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#ece2cd',
          300: '#decfae',
          400: '#c9b58a',
          500: '#b39b6c',
        },
        sage: {
          50: '#f3f6f1',
          100: '#e3ebde',
          200: '#c7d6bd',
          300: '#a6bd96',
          400: '#85a273',
          500: '#688756',
          600: '#516b43',
          700: '#3f5435',
        },
        terracotta: {
          100: '#f4dfd2',
          200: '#e9c1a8',
          300: '#dc9f7d',
          400: '#cd7f57',
          500: '#b9663d',
          600: '#9a5230',
        },
        ink: {
          900: '#2a2622',
          700: '#4a423b',
          500: '#6f655b',
          300: '#a89e93',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(74, 66, 59, 0.12)',
      },
    },
  },
  plugins: [],
}
