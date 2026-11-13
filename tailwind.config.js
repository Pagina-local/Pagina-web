/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#070510',
          900: '#0B091A',
          800: '#13102B',
          700: '#1E1B4B',
        },
        brand: {
          red: '#F43F5E',
          'red-dark': '#E11D48',
          'red-light': '#FB7185',
          mustard: '#FACC15',
          'mustard-dark': '#EAB308',
          'mustard-light': '#FDE047',
          purple: '#A855F7',
          'purple-dark': '#7C3AED',
          'purple-light': '#C084FC',
          indigo: '#6366F1',
          'indigo-dark': '#4F46E5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        bounceIn: { '0%': { transform: 'scale(0.3)', opacity: '0' }, '60%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        twinkle: { '0%, 100%': { opacity: '0.2' }, '50%': { opacity: '1' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        orbit: { '0%': { transform: 'rotate(0deg) translateX(20px) rotate(0deg)' }, '100%': { transform: 'rotate(360deg) translateX(20px) rotate(-360deg)' } },
        glowPulse: { '0%, 100%': { opacity: '0.3' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
};
