/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",

        primary: "rgb(var(--text-primary) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
        tertiary: "rgb(var(--text-tertiary) / <alpha-value>)",

        beacon: "rgb(var(--beacon) / <alpha-value>)",
        route: "rgb(var(--route) / <alpha-value>)",
        brake: "rgb(var(--brake) / <alpha-value>)",
        clear: "rgb(var(--clear) / <alpha-value>)",

        // legacy aliases so existing className="bg-card" etc. keep working
        // while pages are migrated one at a time to the new tokens above
        card: "rgb(var(--bg-elevated) / <alpha-value>)",
        accent: "rgb(var(--beacon) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
    },
  },
  plugins: [],
};
