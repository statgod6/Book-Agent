/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#FDF6E3",
        ink: "#0A0A1A",
        accent: "#E94560",
        gold: "#F5A623",
        surface: "#16213E",
        panel: "#0F3460",
      },
    },
  },
  plugins: [],
};
