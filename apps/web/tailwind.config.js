/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'color-mix(in srgb, var(--color-primary) 70%, white)',
          dark: 'color-mix(in srgb, var(--color-primary) 70%, black)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          light: 'color-mix(in srgb, var(--color-secondary) 70%, white)',
          dark: 'color-mix(in srgb, var(--color-secondary) 70%, black)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'color-mix(in srgb, var(--color-accent) 70%, white)',
          dark: 'color-mix(in srgb, var(--color-accent) 70%, black)',
        },
      },
      screens: {
        '3xl': '1600px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  darkMode: 'class',
}
