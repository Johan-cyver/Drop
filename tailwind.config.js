/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        dark: {
            950: '#0a0a0a', // Deepest black
            900: '#121212', // Surface
            800: '#1E1E1E', // Card
            700: '#2A2A2A', // Stroke
        },
        glass: {
            100: 'rgba(255, 255, 255, 0.05)',
            200: 'rgba(255, 255, 255, 0.10)',
            300: 'rgba(255, 255, 255, 0.15)',
        },
        brand: {
            glow: '#8b5cf6',
            accent: '#6366f1'
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
