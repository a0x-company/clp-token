import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "infinite-scroll": {
          "0%": { transform: "translateX(80%)" },
          "50%": { transform: "translateX(-80%)" },
          "100%": { transform: "translateX(80%)" },
        },
      },
      animation: {
        "infinite-scroll": "infinite-scroll 50s linear infinite",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          blue: "#0267FF",
        },
      },
      fontFamily: {
        helvetica: "var(--font-helvetica)",
        romaben: "var(--font-romaben)",
      },
      boxShadow: {
        brutalist: "4px 4px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
};
export default config;
