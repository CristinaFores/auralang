/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h1: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      colors: {
        brand: {
          purple: '#6C4DFF',
          'purple-dark': '#5638D9',
          accent: '#A855FF',
          soft: '#DDBBFF',
          gradientFrom: '#C13AF5',
          gradientTo: '#2637FF',
        },
        surface: {
          dark: '#0B1020',
          'dark-elevated': '#121A2B',
          light: '#F7F8FC',
          card: '#FFFFFF',
        },
        border: {
          DEFAULT: '#243049',
        },
        muted: '#64748B',
      },
      borderRadius: {
        popup: '12px',
      },
      boxShadow: {
        'glow-purple': '0 0 24px rgba(108, 77, 255, 0.45)',
        'glow-purple-intense': '0 0 36px rgba(168, 85, 255, 0.65)',
      },
      animation: {
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        waveform: 'waveform 1.2s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(108, 77, 255, 0.35)' },
          '50%': { boxShadow: '0 0 32px rgba(168, 85, 255, 0.6)' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
}
