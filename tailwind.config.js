/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Nouvelle palette de couleurs professionnelle
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Palette principale - Bleu juridique professionnel
        primary: {
          DEFAULT: "#2563eb", // Bleu vif
          foreground: "#ffffff",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        
        // Secondaire - Violet élégant
        secondary: {
          DEFAULT: "#7c3aed", // Violet moderne
          foreground: "#ffffff",
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        
        // Accent - Émeraude professionnelle
        accent: {
          DEFAULT: "#10b981", // Vert émeraude
          foreground: "#ffffff",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        
        // Neutres raffinés
        muted: {
          DEFAULT: "#6b7280",
          foreground: "#ffffff",
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
        
        // Couleurs d'état
        success: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        danger: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#0ea5e9",
          foreground: "#ffffff",
        },
        
        // Couleurs spéciales pour l'interface juridique
        legal: {
          blue: "#1e40af", // Bleu juridique profond
          gold: "#d97706", // Or pour les éléments importants
          ivory: "#fef3c7", // Ivoire pour les arrière-plans
          slate: "#475569", // Ardoise pour le texte
          crimson: "#dc2626", // Cramoisi pour les alertes
        },
      },
      
      // Nouvelles polices
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      
      // Effets visuels améliorés
      boxShadow: {
        'legal': '0 4px 14px 0 rgba(0, 0, 0, 0.08)',
        'legal-lg': '0 10px 28px 0 rgba(0, 0, 0, 0.12)',
        'legal-xl': '0 20px 40px 0 rgba(0, 0, 0, 0.16)',
        'legal-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      
      // Animations fluides
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      // Bordures arrondies modernes
      borderRadius: {
        'legal': '0.75rem',
        'legal-lg': '1rem',
        'legal-xl': '1.5rem',
      },
      
      // Dégradés professionnels
      backgroundImage: {
        'legal-gradient': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        'legal-gradient-light': 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
        'accent-gradient': 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
        'subtle-gradient': 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      },
    },
  },
  plugins: [],
}