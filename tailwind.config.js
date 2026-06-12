export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          950: '#07070F',
          900: '#0A0A14',
          800: '#111120',
          700: '#1A1A2E',
          600: '#22223A',
          500: '#82799C',
          400: '#A89FC0',
          300: '#C8C0D8',
          200: '#DCD6EA',
          100: '#F0ECFA',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
        strong: '0 24px 70px rgba(15, 23, 42, 0.18)',
        glow: '0 0 24px rgba(124,58,237,0.35)',
        'glow-sm': '0 0 12px rgba(124,58,237,0.2)',
        'glow-lg': '0 0 48px rgba(124,58,237,0.45)',
        'glow-red': '0 0 16px rgba(239,68,68,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease',
        'slide-up': 'slideUp 250ms ease',
        'slide-in': 'slideIn 300ms ease',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 12px rgba(124,58,237,0.2)' },
          '50%': { boxShadow: '0 0 28px rgba(124,58,237,0.5)' },
        },
      },
    },
  },
  plugins: [],
};
