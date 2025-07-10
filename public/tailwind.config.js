/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // or 'media' if you prefer to use OS preference without toggle
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        background: 'var(--bg-color)',
        card: 'var(--card-bg)',
        text: 'var(--text-color)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'tajawal': ['Tajawal', 'sans-serif'],
      },
      transitionProperty: {
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
    },
  },
  plugins: [],
}
