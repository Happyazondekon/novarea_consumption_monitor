import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        benin: {
          green: "#008751",
          yellow: "#FCD116",
          red: "#E8112D",
        },
        apple: {
          blue: "#0071E3",
          gray: "#F5F5F7",
          dark: "#1D1D1F",
          border: "#D2D2D7",
        },
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "18px",
        "apple-xl": "32px",
      },
    },
  },
  plugins: [],
};
export default config;
