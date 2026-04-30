import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1E3A8A",
          navyDark: "#0F2461",
          gold: "#C8952A",
          cream: "#F8F3E8",
          slate: "#0F172A",
        },
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
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
  plugins: [],
};

export default config;
