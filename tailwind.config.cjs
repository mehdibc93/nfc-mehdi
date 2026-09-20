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
        logoReveal: {
          '0%': { opacity: '0', transform: 'scale(0.8)', letterSpacing: '0.05em' },
          '60%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        introLine: {
          '0%': { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        introFadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        drawCheck: {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
        // Photo du plat qui "flotte" et pivote légèrement en 3D, façon présentoir — scale(1.05)
        // laisse une marge pour que la rotation ne découvre jamais le fond derrière l'image
        // (object-cover recouvre le conteneur, mais un rectangle qui pivote en 3D peut sinon
        // laisser dépasser ses coins).
        floatTilt3D: {
          '0%, 100%': { transform: 'perspective(900px) rotateX(4deg) rotateY(-6deg) translateY(0px) scale(1.05)' },
          '25%': { transform: 'perspective(900px) rotateX(-3deg) rotateY(4deg) translateY(-10px) scale(1.055)' },
          '50%': { transform: 'perspective(900px) rotateX(-5deg) rotateY(7deg) translateY(-2px) scale(1.06)' },
          '75%': { transform: 'perspective(900px) rotateX(3deg) rotateY(-4deg) translateY(-8px) scale(1.055)' },
        },
        // Halo pulsé autour du bouton "Voir en RA" pour attirer l'œil vers une fonctionnalité
        // encore inhabituelle sur une carte de restaurant.
        arGlowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(168, 85, 247, 0.55), 0 4px 18px rgba(88, 28, 135, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(168, 85, 247, 0), 0 4px 18px rgba(88, 28, 135, 0.45)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
        slideUp: 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fadeIn: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        logoReveal: 'logoReveal 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        introLine: 'introLine 500ms 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        introFadeOut: 'introFadeOut 450ms 1400ms ease-in forwards',
        // Trait de coche/cercle qui se dessine (façon Stripe) — pathLength="1" sur le SVG rend
        // strokeDasharray/Offset indépendants de la géométrie réelle du tracé.
        drawCheckCircle: 'drawCheck 550ms ease-out forwards',
        drawCheckMark: 'drawCheck 350ms 500ms ease-out forwards',
        drawCheckSolo: 'drawCheck 320ms ease-out forwards',
        pop: 'pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        floatTilt3D: 'floatTilt3D 9s ease-in-out infinite',
        arGlowPulse: 'arGlowPulse 2.2s ease-in-out infinite',
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
