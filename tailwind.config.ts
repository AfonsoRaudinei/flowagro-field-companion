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
				
				/* FlowAgro Primary - Verde Agrícola */
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					hover: 'hsl(var(--primary-hover))'
				},
				
				/* FlowAgro Secondary - Neutro */
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					hover: 'hsl(var(--secondary-hover))'
				},
				
				/* FlowAgro Info - Azul Confiança */
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					hover: 'hsl(var(--info-hover))'
				},
				
				/* FlowAgro Status Colors */
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
				
				/* FlowAgro Seasonal Colors */
				seasonal: {
					spring: 'hsl(var(--seasonal-spring))',
					summer: 'hsl(var(--seasonal-summer))',
					autumn: 'hsl(var(--seasonal-autumn))',
					winter: 'hsl(var(--seasonal-winter))'
				},
				
				/* Base UI Colors */
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
				
				/* FlowAgro Sidebar */
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
			/* FlowAgro Typography System */
			fontFamily: {
				'primary': ['Sora', 'system-ui', '-apple-system', 'sans-serif'],
				'secondary': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
				'display': ['Sora', 'system-ui', '-apple-system', 'sans-serif'],
				'body': ['Inter', 'system-ui', '-apple-system', 'sans-serif']
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
				
				// FlowAgro semantic scales
				'flow-xs': '0.75rem',
				'flow-sm': '0.875rem', 
				'flow-base': '1rem',
				'flow-lg': '1.125rem',
				'flow-xl': '1.25rem',
				'flow-2xl': '1.5rem',
				'flow-3xl': '1.875rem',
				'flow-4xl': '2.25rem',
				'flow-5xl': '3rem'
			},
			borderRadius: {
				lg: 'var(--radius-lg)',
				md: 'var(--radius)',
				sm: 'var(--radius-sm)'
			},
			/* FlowAgro Shadow System */
			boxShadow: {
				'ios-sm': 'var(--shadow-sm)',
				'ios-md': 'var(--shadow-md)',
				'ios-lg': 'var(--shadow-lg)',
				'ios-button': 'var(--shadow-button)',
				'ios-card': 'var(--shadow-card)',
				'field': 'var(--shadow-field)'
			},
			
			/* FlowAgro Gradients */
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-field': 'var(--gradient-field)',
				'gradient-info': 'var(--gradient-info)',
				'gradient-subtle': 'var(--gradient-subtle)'
			},
			/* FlowAgro Transition System */
			transitionProperty: {
				'all': 'var(--transition-all)',
				'colors': 'var(--transition-colors)',
				'transform': 'var(--transition-transform)',
				'field': 'var(--transition-field)'
			},
			animation: {
				'spring': 'spring 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				'slide-up': 'slideUp 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-down': 'slideDown 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'fade-in': 'fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'fade-out': 'fadeOut 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'scale-in': 'scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				'fullscreen-enter': 'fullscreenEnter 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
				'fullscreen-exit': 'fullscreenExit 0.4s cubic-bezier(0.23, 1, 0.32, 1)',

				// Premium Hover Effects
				'hover-lift': 'hoverLift 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				'hover-glow': 'hoverGlow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

				// Active/Pressed States  
				'press-down': 'pressDown 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
				'bounce-press': 'bouncePress 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',

				// Pulse Animations
				'pulse-availability': 'pulseAvailability 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',

				// State Transitions
				'state-enter': 'stateEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
				'state-exit': 'stateExit 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
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
				},
				'fadeIn': {
					'0%': { opacity: '0', transform: 'scale(0.98)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'fadeOut': {
					'0%': { opacity: '1', transform: 'scale(1)' },
					'100%': { opacity: '0', transform: 'scale(0.98)' }
				},
				'scaleIn': {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'50%': { transform: 'scale(1.02)', opacity: '0.7' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'fullscreenEnter': {
					'0%': { 
						transform: 'scale(0.95)', 
						opacity: '0.8',
						filter: 'blur(2px)'
					},
					'50%': { 
						transform: 'scale(1.01)', 
						opacity: '0.9',
						filter: 'blur(1px)'
					},
					'100%': { 
						transform: 'scale(1)', 
						opacity: '1',
						filter: 'blur(0px)'
					}
				},
				'fullscreenExit': {
					'0%': { 
						transform: 'scale(1)', 
						opacity: '1',
						filter: 'blur(0px)'
					},
					'50%': { 
						transform: 'scale(0.98)', 
						opacity: '0.8',
						filter: 'blur(1px)'
					},
					'100%': { 
						transform: 'scale(0.95)', 
						opacity: '0.6',
						filter: 'blur(2px)'
					}
				},

				// Premium Hover Effects
				'hoverLift': {
					'0%': { 
						transform: 'translateY(0) scale(1)', 
						boxShadow: '0 4px 6px -1px rgba(0, 87, 255, 0.1)' 
					},
					'100%': { 
						transform: 'translateY(-2px) scale(1.02)', 
						boxShadow: '0 20px 25px -5px rgba(0, 87, 255, 0.2), 0 10px 10px -5px rgba(0, 87, 255, 0.1)' 
					}
				},
				'hoverGlow': {
					'0%': { boxShadow: '0 0 0 0 rgba(0, 87, 255, 0)' },
					'100%': { boxShadow: '0 0 20px 4px rgba(0, 87, 255, 0.3), 0 0 40px 8px rgba(0, 87, 255, 0.1)' }
				},

				// Active/Pressed States
				'pressDown': {
					'0%': { transform: 'translateY(0) scale(1)' },
					'100%': { transform: 'translateY(1px) scale(0.98)' }
				},
				'bouncePress': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.95)' },
					'100%': { transform: 'scale(1)' }
				},

				// Pulse Animations
				'pulseAvailability': {
					'0%, 100%': { opacity: '1', transform: 'scale(1)' },
					'50%': { opacity: '0.8', transform: 'scale(1.05)' }
				},
				'pulseGlow': {
					'0%, 100%': { boxShadow: '0 0 5px rgba(0, 87, 255, 0.5)' },
					'50%': { boxShadow: '0 0 20px rgba(0, 87, 255, 0.8), 0 0 30px rgba(0, 87, 255, 0.4)' }
				},

				// State Transitions
				'stateEnter': {
					'0%': { transform: 'scale(0.95)', opacity: '0', filter: 'blur(2px)' },
					'100%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' }
				},
				'stateExit': {
					'0%': { transform: 'scale(1)', opacity: '1', filter: 'blur(0)' },
					'100%': { transform: 'scale(0.95)', opacity: '0', filter: 'blur(2px)' }
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
