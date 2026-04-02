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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.85" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s ease-out both",
        "fade-in-slow": "fade-in-slow 0.6s ease-out both",
        shimmer: "shimmer 1.2s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.5s ease-in-out infinite",
        "spin-slow": "spin-slow 1.1s linear infinite",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      fontSize: {
        "display": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "title": ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.01em" }],
        "body": ["0.9375rem", { lineHeight: "1.5" }],
        "caption": ["0.8125rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        "card": "1rem",
        "input": "0.5rem",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        "lift": "0 8px 24px -4px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.06)",
        "accent-glow": "0 0 0 1px rgb(220 38 38 / 0.12), 0 12px 40px -12px rgb(220 38 38 / 0.25)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
