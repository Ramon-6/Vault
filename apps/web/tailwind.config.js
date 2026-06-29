/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sv: {
          bg: '#EFEEEA',
          surface: '#FFFFFF',
          border: '#E6E4DE',
          text: '#0C0C0A',
          secondary: '#706F6B',
          hint: '#A9A8A3',
          accent: '#B8F241',
          'accent-text': '#0A0E00',
          'accent-bg': 'rgba(184,242,65,0.13)',
          'accent-ok': '#3D5C00',
          'accent-border': 'rgba(184,242,65,0.38)',
          error: '#FF4757',
          info: '#4F8EF7',
          input: '#F8F7F4',
          page: '#F4F3EF',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sv: '6px',
        'sv-md': '8px',
        'sv-lg': '12px',
      },
      keyframes: {
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-7px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0) translateX(-50%)' },
          '50%': { transform: 'translateY(9px) translateX(-50%)' },
        },
      },
      animation: {
        slideDown: 'slideDown .2s ease',
        fadeIn: 'fadeIn .15s ease',
        pulse: 'pulse 1s infinite',
        spin: 'spin .7s linear infinite',
        fadeUp: 'fadeUp .75s cubic-bezier(.16,1,.3,1) both',
        bounce: 'bounce 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
