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
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "infinite-scroll": "infinite-scroll 70s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          blue: "#0267FF",
          "blue-dark": "#0033A0",
          "orange-pastel": "#EF5D52",
          "green-pastel": "#93FF89",
        },
      },
      fontFamily: {
        helvetica: "var(--font-helvetica)",
        beauford: "var(--font-beauford)",
        "beauford-bold": "var(--font-beauford-bold)",
      },
      boxShadow: {
        brutalist: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutalist-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
      },
    },
  },
};
export default config;
