import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './api/**/*.{ts,tsx}',
    './constants.ts',
    './types.ts',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#05090C',
          900: '#0B1219',
          800: '#161F28',
          700: '#25303E',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          900: '#134E4A',
        },
      },
      fontFamily: {
        sans: ['SN Pro', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['SN Pro', 'sans-serif'],
      },
    },
  },
  plugins: [typography],
};
