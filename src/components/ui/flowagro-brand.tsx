import React from 'react';
import { FLOWAGRO_BRAND, FLOWAGRO_COLORS, getBrandColor } from '@/lib/flowagro-brand';
import { cn } from '@/lib/utils';

interface FlowAgroLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'agriculture' | 'earth';
  className?: string;
}

/**
 * FlowAgro Logo Component
 * 
 * Componente oficial do logo FlowAgro com diferentes variantes
 * e tamanhos para uso consistente em toda aplicação
 */
export const FlowAgroLogo: React.FC<FlowAgroLogoProps> = ({
  variant = 'full',
  size = 'md',
  color = 'primary',
  className
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto', 
    xl: 'h-16 w-auto'
  };
  
  const colorValue = getBrandColor(color);
  
  if (variant === 'icon') {
    return (
      <div className={cn(
        "inline-flex items-center justify-center rounded-lg",
        sizeClasses[size],
        className
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full"
          style={{ color: colorValue }}
        >
          {/* FlowAgro Icon - Agricultural Symbol */}
          <path
            d="M12 2L8 6v4l4-2 4 2V6l-4-4z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M8 10v6c0 2.2 1.8 4 4 4s4-1.8 4-4v-6l-4 2-4-2z"
            fill="currentColor"
          />
          <circle
            cx="12"
            cy="16"
            r="1.5"
            fill="white"
            opacity="0.8"
          />
        </svg>
      </div>
    );
  }
  
  if (variant === 'wordmark') {
    return (
      <div className={cn(
        "inline-flex items-center font-primary font-bold",
        sizeClasses[size],
        className
      )}>
        <span 
          className="text-current tracking-tight"
          style={{ color: colorValue }}
        >
          {FLOWAGRO_BRAND.name}
        </span>
      </div>
    );
  }
  
  // Full logo (icon + wordmark)
  return (
    <div className={cn(
      "inline-flex items-center gap-3",
      sizeClasses[size],
      className
    )}>
      {/* Icon part */}
      <div className={cn(
        "inline-flex items-center justify-center rounded-lg",
        sizeClasses[size]
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full"
          style={{ color: colorValue }}
        >
          <path
            d="M12 2L8 6v4l4-2 4 2V6l-4-4z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M8 10v6c0 2.2 1.8 4 4 4s4-1.8 4-4v-6l-4 2-4-2z"
            fill="currentColor"
          />
          <circle
            cx="12"
            cy="16"
            r="1.5"
            fill="white"
            opacity="0.8"
          />
        </svg>
      </div>
      
      {/* Wordmark part */}
      <div className={cn(
        "inline-flex items-center font-primary font-bold",
        sizeClasses[size]
      )}>
        <span 
          className="text-current tracking-tight"
          style={{ color: colorValue }}
        >
          {FLOWAGRO_BRAND.name}
        </span>
      </div>
    </div>
  );
};

interface BrandBadgeProps {
  variant?: 'primary' | 'agriculture' | 'earth' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

/**
 * FlowAgro Brand Badge
 * 
 * Badge component usando as cores e estilo da marca
 */
export const BrandBadge: React.FC<BrandBadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className
}) => {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground border-primary/20',
    agriculture: 'bg-green-500 text-white border-green-600/20',
    earth: 'bg-stone-500 text-white border-stone-600/20',
    outline: 'bg-transparent text-primary border-primary/60'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {children}
    </span>
  );
};

interface BrandCardProps {
  variant?: 'default' | 'field' | 'premium';
  className?: string;
  children: React.ReactNode;
}

/**
 * FlowAgro Brand Card
 * 
 * Card component com estilo da marca FlowAgro
 */
export const BrandCard: React.FC<BrandCardProps> = ({
  variant = 'default',
  className,
  children
}) => {
  const variantClasses = {
    default: 'bg-card border border-border/50 shadow-sm',
    field: 'bg-card border border-primary/20 shadow-field',
    premium: 'bg-gradient-to-br from-primary/5 to-green-500/5 border border-primary/30 shadow-lg'
  };
  
  return (
    <div className={cn(
      'rounded-lg overflow-hidden transition-all duration-200',
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  );
};

interface BrandButtonProps {
  variant?: 'primary' | 'agriculture' | 'earth' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * FlowAgro Brand Button
 * 
 * Button component seguindo o design system da marca
 */
export const BrandButton: React.FC<BrandButtonProps> = ({
  variant = 'primary',
  size = 'md', 
  children,
  className,
  onClick,
  disabled = false
}) => {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-button',
    agriculture: 'bg-green-500 text-white hover:bg-green-600 shadow-field',
    earth: 'bg-stone-600 text-white hover:bg-stone-700',
    outline: 'border border-primary text-primary hover:bg-primary/10'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'hover:-translate-y-0.5 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
};