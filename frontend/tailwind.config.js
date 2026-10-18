/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B00",
          light: "#FF8C3A",
          dark: "#CC5500",
          glow: "rgba(255,107,0,0.35)"
        },
        secondary: {
          DEFAULT: "#5D4037",
          light: "#795548",
          dark: "#3E2723"
        },
        gold: {
          DEFAULT: "#FFB300",
          light: "#FFD54F",
          dark: "#E65100"
        },
        cream: {
          DEFAULT: "#FFF3E0",
          dark: "#FFE0B2",
          deeper: "#FFCCBC"
        },
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#3D2B1F",
          muted: "#6D4C41"
        },
        success: "#2E7D32",
        danger: "#C62828"
      },
      boxShadow: {
        card: "0 2px 4px rgba(93,64,55,0.06), 0 8px 24px rgba(93,64,55,0.12), 0 20px 48px rgba(93,64,55,0.08)",
        "card-hover": "0 4px 8px rgba(93,64,55,0.08), 0 16px 40px rgba(93,64,55,0.18), 0 32px 64px rgba(93,64,55,0.10)",
        "btn-primary": "0 4px 6px rgba(255,107,0,0.25), 0 8px 20px rgba(255,107,0,0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
        "btn-press": "0 1px 3px rgba(255,107,0,0.20), inset 0 2px 4px rgba(0,0,0,0.15)",
        sidebar: "4px 0 32px rgba(93,64,55,0.15), 8px 0 64px rgba(93,64,55,0.08)",
        inner: "inset 0 2px 8px rgba(93,64,55,0.10)",
        "glow-orange": "0 0 24px rgba(255,107,0,0.40), 0 0 48px rgba(255,107,0,0.20)",
        "glow-gold": "0 0 20px rgba(255,179,0,0.45)"
      },
      fontFamily: {
        display: ["Newsreader", "Georgia", "serif"],
        body: ["Be Vietnam Pro", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "dhaba-hero": "linear-gradient(135deg, #FF6B00 0%, #E65100 40%, #5D4037 100%)",
        "card-warm": "linear-gradient(145deg, #FFFFFF 0%, #FFF8F0 100%)",
        "sidebar-bg": "linear-gradient(180deg, #3E2723 0%, #5D4037 60%, #4E342E 100%)",
        "page-bg": "radial-gradient(ellipse at 15% 0%, rgba(255,107,0,0.12) 0%, transparent 50%), radial-gradient(ellipse at 85% 100%, rgba(255,179,0,0.10) 0%, transparent 50%), linear-gradient(160deg, #FFF8F0 0%, #FFF3E0 50%, #FFF8EC 100%)",
        "category-active": "linear-gradient(135deg, #FF6B00, #FF8C3A)",
        "badge-gold": "linear-gradient(135deg, #FFB300, #FF8F00)"
      },
      borderRadius: {
        card: "20px",
        btn: "14px",
        pill: "999px",
        chip: "10px"
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease-out",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        shimmer: "shimmer 2s infinite"
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 20px rgba(255,107,0,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(255,107,0,0.6)" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      }
    }
  },
  plugins: []
};
