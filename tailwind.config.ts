import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff563c',
          hover: '#e6402a',
          light: '#ff7a65',
        },
        bg: {
          primary: '#141212',
          secondary: '#1c1a1a',
          card: '#211f1f',
          border: '#2e2b2b',
        },
        text: {
          primary: '#f4f1ef',
          muted: '#9e9a97',
          faint: '#5c5957',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      }
    },
  },
  plugins: [],
}

export default config
