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
        bg: "#f6f7fb",
        surface: "#ffffff",
        "surface-elevated": "#ffffff",
        border: "#eef0f3",
        "border-subtle": "#f2f4f7",
        divider: "#f0f2f5",
        text: "#2d3748",
        "text-secondary": "#4a5568",
        muted: "#718096",
        "muted-strong": "#4a5568",
        accent: "#4255ff",
        "accent-hover": "#3142c9",
        "accent-light": "#e8ebff",
        green: "#23c275",
        "green-light": "#e6f7ef",
        orange: "#ffcd1f",
        "orange-light": "#fff8e6",
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "28px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
