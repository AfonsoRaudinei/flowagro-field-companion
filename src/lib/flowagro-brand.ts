/**
 * FlowAgro Brand System
 * 
 * Sistema completo de identidade visual e branding
 * para aplicação agrícola profissional
 */

// ============= CORE BRAND VALUES =============

export const FLOWAGRO_BRAND = {
  name: 'FlowAgro',
  tagline: 'Tecnologia Agrícola Avançada',
  description: 'App técnico de agricultura para uso em campo por produtores e consultores',
  version: '2.0',
  
  // Mission & Vision
  mission: 'Democratizar tecnologia agrícola avançada para produtores rurais',
  vision: 'Agricultura mais produtiva, sustentável e inteligente',
  
  // Brand Personality
  personality: {
    reliable: 'Confiável e robusto para uso no campo',
    innovative: 'Tecnologia de ponta acessível',
    practical: 'Soluções práticas para problemas reais',
    professional: 'Ferramenta séria para profissionais'
  }
} as const;

// ============= COLOR SYSTEM =============

export const FLOWAGRO_COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#E8F2FF',   // Ultra light blue
    100: '#B8DBFF',  // Light blue  
    200: '#87C4FF',  // Medium light blue
    300: '#56ACFF',  // Medium blue
    400: '#2E95FF',  // Medium dark blue
    500: '#0057FF',  // FlowAgro Blue (Primary)
    600: '#0048D9',  // Dark blue
    700: '#003AB3',  // Darker blue
    800: '#002C8C',  // Very dark blue
    900: '#001E66',  // Ultra dark blue
    DEFAULT: '#0057FF'
  },
  
  // Agricultural Greens
  agriculture: {
    50: '#F0FDF4',   // Ultra light green
    100: '#DCFCE7',  // Light green
    200: '#BBF7D0',  // Medium light green
    300: '#86EFAC',  // Medium green
    400: '#4ADE80',  // Medium bright green
    500: '#22C55E',  // Bright green
    600: '#16A34A',  // FlowAgro Green
    700: '#15803D',  // Dark green
    800: '#166534',  // Darker green
    900: '#14532D',  // Ultra dark green
    DEFAULT: '#16A34A'
  },
  
  // Earth Tones
  earth: {
    50: '#FAFAF9',   // Ultra light brown
    100: '#F5F5F4',  // Light brown
    200: '#E7E5E4',  // Medium light brown
    300: '#D6D3D1',  // Medium brown
    400: '#A8A29E',  // Medium gray-brown
    500: '#78716C',  // Brown-gray
    600: '#57534E',  // Dark brown
    700: '#44403C',  // Darker brown
    800: '#292524',  // Very dark brown
    900: '#1C1917',  // Ultra dark brown
    DEFAULT: '#78716C'
  },
  
  // Warning & Status Colors
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    DEFAULT: '#F59E0B'
  },
  
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    DEFAULT: '#EF4444'
  },
  
  success: {
    50: '#F0FDF4',
    500: '#10B981',
    DEFAULT: '#10B981'
  }
} as const;

// ============= TYPOGRAPHY SYSTEM =============

export const FLOWAGRO_TYPOGRAPHY = {
  // Font Families
  fonts: {
    // Primary: Modern, clean, technical
    primary: 'Sora, system-ui, -apple-system, sans-serif',
    
    // Secondary: Readable, friendly
    secondary: 'Inter, system-ui, -apple-system, sans-serif',
    
    // Monospace: Code, data, technical info
    mono: 'JetBrains Mono, Consolas, Monaco, monospace'
  },
  
  // Font Scales (optimized for mobile-first)
  scales: {
    // Mobile-first scale
    mobile: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px  
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    
    // Desktop scale  
    desktop: {
      xs: '0.875rem',   // 14px
      sm: '1rem',       // 16px
      base: '1.125rem', // 18px
      lg: '1.25rem',    // 20px
      xl: '1.5rem',     // 24px
      '2xl': '1.875rem', // 30px
      '3xl': '2.25rem', // 36px
      '4xl': '3rem',    // 48px
      '5xl': '4rem'     // 64px
    }
  },
  
  // Semantic Typography
  semantic: {
    display: {
      font: 'Sora',
      weight: '700',
      lineHeight: '1.1',
      letterSpacing: '-0.02em'
    },
    
    heading: {
      font: 'Sora', 
      weight: '600',
      lineHeight: '1.2',
      letterSpacing: '-0.01em'
    },
    
    body: {
      font: 'Inter',
      weight: '400', 
      lineHeight: '1.5',
      letterSpacing: '0'
    },
    
    caption: {
      font: 'Inter',
      weight: '500',
      lineHeight: '1.4', 
      letterSpacing: '0.01em'
    },
    
    technical: {
      font: 'JetBrains Mono',
      weight: '400',
      lineHeight: '1.4',
      letterSpacing: '0.02em'
    }
  }
} as const;

// ============= SPACING SYSTEM =============

export const FLOWAGRO_SPACING = {
  // Base scale (rem units)
  scale: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px  
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem'     // 96px
  },
  
  // Semantic spacing
  semantic: {
    micro: '0.25rem',   // 4px - borders, fine details
    tiny: '0.5rem',     // 8px - between related elements
    small: '0.75rem',   // 12px - between components
    base: '1rem',       // 16px - standard spacing
    medium: '1.5rem',   // 24px - between sections  
    large: '2rem',      // 32px - between major sections
    huge: '3rem',       // 48px - page-level spacing
    giant: '4rem'       // 64px - hero sections
  },
  
  // Touch targets (for mobile)
  touch: {
    minimum: '44px',    // iOS minimum
    comfortable: '48px', // Android comfortable
    large: '56px'       // For field use with gloves
  }
} as const;

// ============= COMPONENT TOKENS =============

export const FLOWAGRO_COMPONENTS = {
  // Border radius system
  radius: {
    none: '0',
    sm: '0.375rem',    // 6px
    base: '0.5rem',    // 8px  
    md: '0.75rem',     // 12px
    lg: '1rem',        // 16px
    xl: '1.5rem',      // 24px
    full: '9999px'
  },
  
  // Shadow system (agricultural/outdoor optimized)
  shadows: {
    field: '0 4px 16px rgba(0, 87, 255, 0.12), 0 2px 4px rgba(0, 87, 255, 0.08)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
    button: '0 2px 8px rgba(0, 87, 255, 0.24)',
    depth: '0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
    glow: '0 0 20px rgba(0, 87, 255, 0.3)',
    none: 'none'
  },
  
  // Transition system 
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)', 
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
} as const;

// ============= BRAND ASSETS =============

export const FLOWAGRO_ASSETS = {
  logos: {
    // SVG paths for logos (inline for performance)
    wordmark: 'M12 2l3.09 6.26L22 9l-5.24 3.19L18 22l-6-3.15L6 22l1.24-9.81L2 9l6.91-0.74L12 2z',
    icon: 'M12 2l3.09 6.26L22 9l-5.24 3.19L18 22l-6-3.15L6 22l1.24-9.81L2 9l6.91-0.74L12 2z',
    symbol: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z'
  },
  
  // Icon system (agricultural themed)
  icons: {
    growth: '🌱',
    harvest: '🌾', 
    field: '🚜',
    weather: '🌤️',
    analytics: '📊',
    location: '📍'
  },
  
  // Emoji system for quick use
  emoji: {
    brand: '🌾',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
    field: '🚜',
    growth: '📈'
  }
} as const;

// ============= BRAND GUIDELINES =============

export const FLOWAGRO_GUIDELINES = {
  // Logo usage
  logo: {
    minimumSize: '24px',
    clearSpace: '16px',
    preferredFormats: ['SVG', 'PNG'],
    backgroundColors: ['white', 'light gray', 'dark backgrounds'],
    avoidOn: ['busy patterns', 'low contrast backgrounds']
  },
  
  // Color usage
  color: {
    primaryUse: 'Actions, links, brand elements',
    agricultureUse: 'Success states, growth indicators, positive metrics',
    earthUse: 'Text, backgrounds, neutral elements',
    accessibility: 'All combinations WCAG AA compliant'
  },
  
  // Typography usage
  typography: {
    display: 'Hero sections, main headings',
    heading: 'Section titles, card headers',
    body: 'Paragraphs, descriptions, content',
    caption: 'Labels, metadata, small text',
    technical: 'Code, coordinates, measurements'
  },
  
  // Voice & Tone
  voice: {
    tone: 'Professional, approachable, reliable',
    language: 'Clear, direct, technical when needed',
    avoid: 'Marketing jargon, overly casual language',
    prefer: 'Action-oriented, solution-focused'
  }
} as const;

// ============= UTILITY FUNCTIONS =============

export const getBrandColor = (color: string, shade?: number) => {
  const colorMap = FLOWAGRO_COLORS as any;
  if (shade) {
    return colorMap[color]?.[shade] || colorMap[color]?.DEFAULT;
  }
  return colorMap[color]?.DEFAULT || color;
};

export const getBrandFont = (type: 'primary' | 'secondary' | 'mono') => {
  return FLOWAGRO_TYPOGRAPHY.fonts[type];
};

export const getBrandSpacing = (size: keyof typeof FLOWAGRO_SPACING.scale | string) => {
  if (size in FLOWAGRO_SPACING.scale) {
    return FLOWAGRO_SPACING.scale[size as keyof typeof FLOWAGRO_SPACING.scale];
  }
  return size;
};

export const applyFlowAgroBranding = () => {
  // Apply brand name and favicon
  document.title = `${FLOWAGRO_BRAND.name} - ${FLOWAGRO_BRAND.tagline}`;
  
  // Set CSS custom properties for brand colors
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', FLOWAGRO_COLORS.primary.DEFAULT);
  root.style.setProperty('--brand-agriculture', FLOWAGRO_COLORS.agriculture.DEFAULT);
  root.style.setProperty('--brand-earth', FLOWAGRO_COLORS.earth.DEFAULT);
  
  // Set brand fonts
  root.style.setProperty('--font-primary', FLOWAGRO_TYPOGRAPHY.fonts.primary);
  root.style.setProperty('--font-secondary', FLOWAGRO_TYPOGRAPHY.fonts.secondary);
  root.style.setProperty('--font-mono', FLOWAGRO_TYPOGRAPHY.fonts.mono);
};