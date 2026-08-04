/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 12px 30px rgba(28, 47, 71, 0.30)',
        soft: '0 1px 2px rgba(15, 20, 30, 0.04), 0 20px 45px -18px rgba(15, 20, 30, 0.16)',
        card: '0 2px 8px rgba(15, 20, 30, 0.05), 0 24px 48px -18px rgba(15, 20, 30, 0.22)',
      },
      backgroundImage: {
        'hero-grid':
          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
        slideUp: 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fadeIn: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        navy: {
          50: '#eef2f8',
          100: '#dbe3f0',
          200: '#b6c5e0',
          300: '#8aa3c9',
          400: '#5c7aab',
          500: '#3c5a86',
          600: '#2b4266',
          700: '#1c2f47',
          800: '#111e30',
        },
      },
    },
  },
  plugins: [],
};
