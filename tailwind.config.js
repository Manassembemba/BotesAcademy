/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                outfit: ['Outfit', 'sans-serif'],
            },
            fontSize: {
                'xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
                'sm': ['clamp(0.875rem, 0.825rem + 0.35vw, 1rem)', { lineHeight: '1.5' }],
                'base': ['clamp(1rem, 0.95rem + 0.5vw, 1.125rem)', { lineHeight: '1.6' }],
                'lg': ['clamp(1.125rem, 1.05rem + 0.75vw, 1.25rem)', { lineHeight: '1.5' }],
                'xl': ['clamp(1.25rem, 1.15rem + 1vw, 1.5rem)', { lineHeight: '1.4' }],
                '2xl': ['clamp(1.5rem, 1.35rem + 1.5vw, 2rem)', { lineHeight: '1.3' }],
                '3xl': ['clamp(2rem, 1.8rem + 2vw, 2.5rem)', { lineHeight: '1.2' }],
                '4xl': ['clamp(2.5rem, 2.2rem + 3vw, 3.5rem)', { lineHeight: '1.1' }],
                '5xl': ['clamp(3.5rem, 3rem + 5vw, 5.5rem)', { lineHeight: '1' }],
                '6xl': ['clamp(4.5rem, 4rem + 8vw, 8rem)', { lineHeight: '0.9' }],
            },
            spacing: {
                'fluid-xs': 'clamp(0.5rem, 0.4rem + 0.5vw, 1rem)',
                'fluid-sm': 'clamp(1rem, 0.8rem + 1vw, 2rem)',
                'fluid-md': 'clamp(2rem, 1.6rem + 2vw, 4rem)',
                'fluid-lg': 'clamp(4rem, 3.2rem + 4vw, 8rem)',
                'fluid-xl': 'clamp(8rem, 6.4rem + 8vw, 16rem)',
            },
            colors: {
                border: "oklch(var(--border) / <alpha-value>)",
                input: "oklch(var(--input) / <alpha-value>)",
                ring: "oklch(var(--ring) / <alpha-value>)",
                background: "oklch(var(--background) / <alpha-value>)",
                foreground: "oklch(var(--foreground) / <alpha-value>)",
                primary: {
                    DEFAULT: "oklch(var(--primary) / <alpha-value>)",
                    foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
                },
                secondary: {
                    DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
                    foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
                    foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "oklch(var(--muted) / <alpha-value>)",
                    foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "oklch(var(--accent) / <alpha-value>)",
                    foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
                },
                success: "oklch(var(--success) / <alpha-value>)",
                warning: "oklch(var(--warning) / <alpha-value>)",
                popover: {
                    DEFAULT: "oklch(var(--popover) / <alpha-value>)",
                    foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "oklch(var(--card) / <alpha-value>)",
                    foreground: "oklch(var(--card-foreground) / <alpha-value>)",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                "2xl": "1.5rem",
                "3xl": "2rem",
                "4xl": "2.5rem",
            },
            boxShadow: {
              'glow-primary': '0 0 20px -5px hsl(var(--primary) / 0.5), 0 0 40px -10px hsl(var(--primary) / 0.3)',
              'glow-primary-sm': '0 0 10px -2px hsl(var(--primary) / 0.4)',
              'glow-amber': '0 0 20px -5px hsl(38 92% 50% / 0.5)',
              'glow-emerald': '0 0 20px -5px hsl(142 71% 45% / 0.5)',
              'glow-indigo': '0 0 20px -5px hsl(239 84% 59% / 0.5)',
              'soft-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                "fade-in": {
                    from: {
                        opacity: "0",
                    },
                    to: {
                        opacity: "1",
                    },
                },
                "slide-up": {
                    from: {
                        transform: "translateY(20px)",
                        opacity: "0",
                    },
                    to: {
                        transform: "translateY(0)",
                        opacity: "1",
                    },
                },
                "scale-in": {
                    from: {
                        transform: "scale(0.95)",
                        opacity: "0",
                    },
                    to: {
                        transform: "scale(1)",
                        opacity: "1",
                    },
                },
                "glow": {
                    "0%, 100%": {
                        opacity: "1",
                    },
                    "50%": {
                        opacity: "0.5",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in": "fade-in 0.5s ease-out",
                "slide-up": "slide-up 0.5s ease-out",
                "scale-in": "scale-in 0.3s ease-out",
                "glow": "glow 2s ease-in-out infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
