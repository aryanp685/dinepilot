import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--dp-bg-canvas)",
        surface: "var(--dp-bg-surface)",
        subtle: "var(--dp-bg-subtle)",
        forest: {
          DEFAULT: "#0F291E",
          800: "#163829",
          700: "#1E4B38",
          600: "#286249",
          100: "#E6ECE8",
          50: "#F2F6F3",
        },
        saffron: {
          DEFAULT: "#D97706",
          600: "#B45309",
          100: "#FEF3C7",
          50: "#FFFBEB",
        },
        lime: {
          DEFAULT: "#65A30D",
          500: "#84CC16",
          100: "#ECFCCB",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        editorial:
          "0 1px 2px rgba(15, 41, 30, 0.04), 0 8px 24px -4px rgba(15, 41, 30, 0.06)",
        card: "0 1px 3px rgba(15, 41, 30, 0.05), 0 1px 2px rgba(15, 41, 30, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
