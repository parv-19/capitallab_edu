import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "3rem",
        xl: "4rem",
      },
      screens: {
        "2xl": "1600px",
      },
    },
    extend: {
      colors: {
        brand: {
          navy: "#1E3A8A",
          navyDark: "#0F2461",
          gold: "#C8952A",
          cream: "#F8F3E8",
          slate: "#0F172A",
        },
        cfa: {
          navy: "#0D1B3E",
          navyMid: "#1A2D5A",
          navyLight: "#2A4080",
          gold: "#C9A84C",
          goldLight: "#E8C97A",
          goldPale: "#F5E9C8",
          cream: "#FDFAF4",
          textDark: "#0D1B3E",
          textMid: "#3A4A6B",
          textMuted: "#7A8099",
          lilac: "#F5F6FF",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        jakarta: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 36, 97, 0.15)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 30%), radial-gradient(circle at 80% 30%, rgba(200,149,42,0.24), transparent 28%), linear-gradient(135deg, #0F2461 0%, #1E3A8A 55%, #2563EB 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
