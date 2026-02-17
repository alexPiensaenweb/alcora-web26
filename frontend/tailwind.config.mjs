/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "var(--color-navy)",
        action: "var(--color-action)",
        "action-hover": "var(--color-action-hover)",
        "text-muted": "var(--color-text-muted)",
        "bg-light": "var(--color-bg-light)",
        "bg-accent": "var(--color-bg-accent)",
        border: "var(--color-border)",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
