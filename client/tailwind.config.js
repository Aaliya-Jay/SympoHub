/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        midnight: '#10152D',
        lilac: '#C7B8FF',
        mint: '#B8F1DB',
        coral: '#FFC6BC'
      },
      boxShadow: {
        glow: '0 24px 80px rgba(104, 95, 205, .15)',
        glass: '0 20px 70px rgba(18, 26, 65, .25)'
      },
      backgroundImage: {
        'cosmic-wash': 'radial-gradient(circle at 15% 15%, rgba(165, 154, 255, .25), transparent 32%), radial-gradient(circle at 82% 18%, rgba(144, 233, 214, .17), transparent 26%), radial-gradient(circle at 70% 82%, rgba(255, 189, 174, .14), transparent 30%)'
      }
    }
  },
  plugins: []
};
