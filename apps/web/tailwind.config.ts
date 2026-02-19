import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ── Fonts ── */
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
      },

      /* ── Shadcn/UI semantic colors (resolve CSS vars from :root) ── */
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        /* Status colors */
        success: "#1F6F4A",
        warning: "#C9A84C",

        /* KobKlein Vault palette */
        vault: {
          black: "#060D1F",
          navy: "#0A1128",
          panel: "#111A30",
        },

        /* Gold system */
        kob: {
          gold: "#C9A84C",
          "gold-light": "#E2CA6E",
          "gold-dark": "#9F7F2C",
          text: "#F0F1F5",
          body: "#B8BCC8",
          muted: "#7A8394",
        },
      },

      /* ── Border radius (matches shadcn/ui) ── */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },

      /* ── Ring offset (shadcn/ui uses ring-offset-background) ── */
      ringOffsetColor: {
        background: "var(--background)",
      },
    },
  },
  plugins: [],
};

export default config;
