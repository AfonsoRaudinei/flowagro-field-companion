import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface QuickAccessCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accentColor: string;
  className?: string;
  isActive?: boolean;
}

/**
 * Optimized individual quick access card component
 * Memoized for better performance with frequent re-renders
 */
export const QuickAccessCard = memo<QuickAccessCardProps>(({
  icon,
  title,
  subtitle,
  onClick,
  accentColor,
  className,
  isActive = false
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styling - Grok-inspired with FlowAgro silver/prata
        "group relative overflow-hidden rounded-2xl bg-card/95 backdrop-blur-sm",
        "border border-border/50 text-left",
        
        // Responsive padding and sizing
        "p-2.5 sm:p-3 min-h-[70px] sm:min-h-[80px]",
        
        // Enhanced transitions and spring animations
        "transition-all duration-300 ease-out",
        "transform-gpu will-change-transform",
        
        // Grok-style shadows with silver undertones
        "shadow-[0_2px_8px_rgba(214,211,209,0.15),0_1px_3px_rgba(214,211,209,0.1)]",
        "hover:shadow-[0_8px_30px_rgba(214,211,209,0.25),0_4px_15px_rgba(214,211,209,0.15)]",
        
        // Premium hover effects - Grok-style lift (reduced on mobile)
        "sm:hover:scale-[1.02] sm:hover:-translate-y-1",
        "active:scale-[0.98] active:translate-y-0",
        
        // Touch-friendly states for mobile
        "touch-manipulation select-none",
        "active:bg-card/80 active:shadow-inner",
        
        // Focus states with FlowAgro primary color
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
        "focus:ring-offset-background",
        
        // Active state styling
        isActive && "ring-2 ring-primary/40 bg-primary/5",
        
        // Disabled states
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        
        className
      )}
      style={{
        // CSS custom properties for dynamic theming
        '--card-accent': accentColor,
        '--card-accent-light': `${accentColor}15`,
        '--card-accent-glow': `${accentColor}25`,
      } as React.CSSProperties}
    >
      {/* Animated background gradient - only visible on hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, var(--card-accent-light) 0%, transparent 60%)`
        }}
      />
      
      {/* Subtle border glow on hover */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px var(--card-accent-glow)`
        }}
      />
      
      {/* Premium shine effect - Grok signature */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-[1px] transform translate-y-0 group-hover:translate-y-2 transition-transform duration-700"
          style={{
            background: `linear-gradient(90deg, transparent 0%, var(--card-accent) 50%, transparent 100%)`,
            filter: 'blur(0.5px)'
          }}
        />
      </div>
      
      {/* Content container */}
      <div className="relative z-10 flex items-start space-x-3 sm:space-x-4">
        {/* Icon container with enhanced styling */}
        <div 
          className={cn(
            "flex-shrink-0 rounded-xl",
            "p-2 sm:p-3",
            "bg-gradient-to-br from-muted/40 to-muted/20",
            "border border-border/30",
            "sm:group-hover:scale-110 sm:group-hover:rotate-3",
            "transition-all duration-300 ease-out transform-gpu"
          )}
          style={{
            backgroundColor: `var(--card-accent-light)`,
            borderColor: `${accentColor}20`,
            color: accentColor
          }}
        >
          <div className="transform sm:group-hover:scale-110 transition-transform duration-300">
            <div className="w-5 h-5 sm:w-6 sm:h-6">{icon}</div>
          </div>
        </div>
        
        {/* Text content with Grok typography */}
        <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
          {/* Title with FlowAgro secondary font */}
          <h3 className={cn(
            "font-secondary font-semibold text-card-foreground",
            "text-sm sm:text-[15px] leading-tight tracking-[-0.01em]",  // Responsive text size
            "group-hover:text-foreground transition-colors duration-200"
          )}>
            {title}
          </h3>
          
          {/* Subtitle with muted styling */}
          <p className={cn(
            "font-secondary text-muted-foreground mt-0.5 sm:mt-1",
            "text-xs sm:text-[13px] leading-tight tracking-[-0.005em]",  // Responsive text size
            "group-hover:text-muted-foreground/80 transition-colors duration-200",
            "line-clamp-1"  // Prevent text overflow on small screens
          )}>
            {subtitle}
          </p>
        </div>
        
        {/* Subtle chevron indicator - Grok-style */}
        <div className={cn(
          "flex-shrink-0 opacity-30 group-hover:opacity-60",
          "transform translate-x-0 group-hover:translate-x-1",
          "transition-all duration-300 ease-out"
        )}>
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="none" 
            className="text-muted-foreground"
          >
            <path 
              d="M4.5 3L7.5 6L4.5 9" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      
      {/* Bottom highlight line - Grok signature element */}
      <div 
        className={cn(
          "absolute bottom-0 left-4 right-4 h-[1px]",
          "opacity-0 group-hover:opacity-100",
          "transform scale-x-0 group-hover:scale-x-100",
          "transition-all duration-500 ease-out origin-center"
        )}
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--card-accent) 50%, transparent 100%)`
        }}
      />
    </button>
  );
});

QuickAccessCard.displayName = 'QuickAccessCard';