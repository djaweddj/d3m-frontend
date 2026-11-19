/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "green-deep": "#0A2F1C",
        "green-soft": "#0B5A3C",
        gold: { DEFAULT: "#C8A24A", deep: "#A8832F" },
        ivory: "#F8F6EF",
        sand: "#EFEADB",
        "algeria-red": "#C51F2D",
      },
      fontFamily: {
        display: ['"Reem Kufi"', "Cairo", "serif"],
        body: ["Cairo", "system-ui", "sans-serif"],
        latin: ['"Cormorant Garamond"', "serif"],
      },
    },
  },
  plugins: [],
};