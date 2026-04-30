/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0a0f1e',
        neonCyan: '#00f5ff',
        neonViolet: '#bf00ff',
        glassWhite: 'rgba(255, 255, 255, 0.05)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to right, #00f5ff, #bf00ff)',
        'dark-gradient': 'radial-gradient(circle at top, #1a1f3a 0%, #0a0f1e 100%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px #00f5ff, 0 0 20px rgba(0, 245, 255, 0.3)',
        'neon-violet': '0 0 10px #bf00ff, 0 0 20px rgba(191, 0, 255, 0.3)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
}