import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			/* iOS spacing system */
			spacing: {
				'xs': 'var(--space-xs)',
				'sm': 'var(--space-sm)', 
				'md': 'var(--space-md)',
				'base': 'var(--space-base)',
				'lg': 'var(--space-lg)',
				'xl': 'var(--space-xl)',
				'2xl': 'var(--space-2xl)',
				'3xl': 'var(--space-3xl)',
				'touch': 'var(--space-3xl)', /* 44px iOS touch target */
			},
			/* iOS typography scale */
			fontSize: {
				'ios-xs': 'var(--text-xs)',
				'ios-sm': 'var(--text-sm)',
				'ios-base': 'var(--text-base)',
				'ios-lg': 'var(--text-lg)', 
				'ios-xl': 'var(--text-xl)',
				'ios-2xl': 'var(--text-2xl)',
				'ios-3xl': 'var(--text-3xl)',
			},
			borderRadius: {
				lg: 'var(--radius-lg)',
				md: 'var(--radius)',
				sm: 'var(--radius-sm)'
			},
			boxShadow: {
				'ios-sm': 'var(--shadow-sm)',
				'ios-md': 'var(--shadow-md)',
				'ios-lg': 'var(--shadow-lg)',
				'ios-button': 'var(--shadow-button)',
				'ios-card': 'var(--shadow-card)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-subtle': 'var(--gradient-subtle)'
			},
			transitionProperty: {
				'all': 'var(--transition-all)',
				'colors': 'var(--transition-colors)',
				'transform': 'var(--transition-transform)'
			},
			animation: {
				'spring': 'spring 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				'slide-up': 'slideUp 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-down': 'slideDown 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'spring': {
					'0%': { transform: 'scale(0.95) translateY(10px)', opacity: '0' },
					'60%': { transform: 'scale(1.02) translateY(-2px)', opacity: '0.8' },
					'100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
				},
				'slideUp': {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'slideDown': {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
