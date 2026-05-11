import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}","./pages/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "cfs-green":      "#2CB520",
        "cfs-green-dark": "#1A6E0E",
        "cfs-lime":       "#7ED430",
        "cfs-orange":     "#E86818",
        "cfs-yellow":     "#F0C020",
        "cfs-red":        "#E83858",
        "cfs-cream":      "#F5F0E0",
        "cfs-dark":       "#1A1E14",
        border:"hsl(var(--border))",input:"hsl(var(--input))",ring:"hsl(var(--ring))",background:"hsl(var(--background))",foreground:"hsl(var(--foreground))",
        primary:{ DEFAULT:"hsl(var(--primary))",foreground:"hsl(var(--primary-foreground))" },
        secondary:{ DEFAULT:"hsl(var(--secondary))",foreground:"hsl(var(--secondary-foreground))" },
        muted:{ DEFAULT:"hsl(var(--muted))",foreground:"hsl(var(--muted-foreground))" },
        accent:{ DEFAULT:"hsl(var(--accent))",foreground:"hsl(var(--accent-foreground))" },
        destructive:{ DEFAULT:"hsl(var(--destructive))",foreground:"hsl(var(--destructive-foreground))" },
      },
      fontFamily: {
        bangers: ["var(--font-bangers)","Bangers","cursive"],
        serif:   ["var(--font-dm-serif)","DM Serif Display","Georgia","serif"],
        sans:    ["var(--font-inter)","Inter","system-ui","sans-serif"],
      },
      borderRadius:{ lg:"var(--radius)",md:"calc(var(--radius) - 2px)",sm:"calc(var(--radius) - 4px)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
