import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        hunter: {
          dark: "#0a0a0a",
          gold: "#d4af37",
          border: "#1f1f1f"
        }
      }
    }
  },
  plugins: [],
};
export default config;
