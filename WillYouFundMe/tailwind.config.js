/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#0b1220",
        },
      },
      boxShadow: {
        'glow': '0 25px 50px -12px rgba(79, 70, 229, 0.35)',
      },
    },
  },
  plugins: [],
};
