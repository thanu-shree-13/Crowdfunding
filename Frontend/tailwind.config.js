/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        epilogue: ['Epilogue', 'sans-serif'],
      },

      boxShadow: {
        secondary: '10px 10px 20px rgba(2, 2, 2, 0.25)',
        glow: '0 0 30px rgba(34, 197, 94, 0.5)',
        'glow-strong': '0 0 50px rgba(34, 197, 94, 0.8)',
      },

      keyframes: {
        loadingBar: {
          '0%': { left: '-40%' },
          '50%': { left: '30%' },
          '100%': { left: '100%' },
        },

        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },

        pulse: {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.05)' },
        },

        glowPulse: {
          '0%, 100%': { 
            opacity: 0.3,
            filter: 'blur(40px)'
          },
          '50%': { 
            opacity: 0.6,
            filter: 'blur(60px)'
          },
        },

        textGlow: {
          '0%, 100%': { 
            textShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
          },
          '50%': { 
            textShadow: '0 0 20px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.4)',
          },
        },

        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },

        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },

      animation: {
        loadingBar: 'loadingBar 1.5s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        glowPulse: 'glowPulse 3s ease-in-out infinite',
        textGlow: 'textGlow 2s ease-in-out infinite',
        rotate: 'rotate 20s linear infinite',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};