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
        navy: {
          DEFAULT: "#101820",
          950: "#0B1117",
          900: "#101820",
          800: "#182430",
          700: "#223242",
        },
        forest: {
          DEFAULT: "#176B52",
          800: "#125541",
          700: "#176B52",
          600: "#1D8264",
          100: "#E8F3EF",
          50: "#F2F8F6",
        },
        emerald: {
          DEFAULT: "#20A67A",
          600: "#198763",
          500: "#20A67A",
          400: "#34BF92",
          100: "#E6F7F1",
          50: "#F2FBF8",
        },
        ivory: {
          DEFAULT: "#F8F7F3",
          100: "#F1EFE9",
          200: "#E7E4DC",
        },
        gold: {
          DEFAULT: "#C6A15B",
          600: "#AD8944",
          100: "#F9F4EA",
          50: "#FCF9F3",
        },
        slate: {
          DEFAULT: "#64748B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
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
          "0 1px 2px rgba(16, 24, 32, 0.04), 0 12px 32px -6px rgba(16, 24, 32, 0.07)",
        card: "0 1px 3px rgba(16, 24, 32, 0.04), 0 1px 2px rgba(16, 24, 32, 0.02)",
        elevated:
          "0 4px 12px -2px rgba(16, 24, 32, 0.06), 0 20px 40px -12px rgba(16, 24, 32, 0.10)",
        navy: "0 20px 50px -12px rgba(16, 24, 32, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
