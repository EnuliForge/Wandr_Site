/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wandr: {
          wilfred: "#16908c",
          rose: "#e9b8b5",
          joyce: "#034545",
        },
      },
    },
  },
  plugins: [],
};
