import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const premiumButtonVariants = cva(
  "premium-button inline-flex items-center justify-center whitespace-nowrap rounded-md text-ios-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground premium-hover premium-press hover:bg-primary/90 focus-visible:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground premium-hover premium-press hover:bg-destructive/90 focus-visible:bg-destructive/90",
        outline: "border border-input bg-background premium-hover premium-press hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground premium-hover premium-press hover:bg-secondary/80 focus-visible:bg-secondary/80",
        ghost: "premium-hover premium-press hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
        link: "text-primary underline-offset-4 premium-hover hover:underline focus-visible:underline focus-visible:ring-0 focus-visible:ring-transparent min-h-auto min-w-auto",
        premium: "bg-gradient-primary text-primary-foreground premium-hover premium-press premium-glow shadow-lg hover:shadow-xl focus-visible:shadow-xl",
        glow: "bg-primary text-primary-foreground premium-hover premium-press glow-pulse hover:shadow-lg focus-visible:shadow-lg"
      },
      size: {
        default: "h-12 px-4 py-2 min-w-[120px]", // Increased from h-10 to meet 44px requirement
        sm: "h-11 rounded-md px-3 min-w-[88px]", // Increased from h-9
        lg: "h-14 rounded-md px-8 min-w-[140px]", // Increased from h-11
        icon: "h-12 w-12", // Increased from h-10 w-10 to meet 44px
        touch: "h-12 px-6 py-3 min-w-[132px]" // Already meets 44px standard
      },
      animation: {
        none: "",
        hover: "premium-hover",
        press: "premium-press",
        bounce: "premium-bounce",
        pulse: "availability-pulse",
        glow: "glow-pulse",
        full: "premium-hover premium-press premium-glow"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "full"
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
  hapticFeedback?: boolean;
  pulseOnClick?: boolean;
  // Accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  role?: string;
  tabIndex?: number;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    hapticFeedback = true,
    pulseOnClick = false,
    ariaLabel,
    ariaDescribedBy,
    role,
    tabIndex,
    onClick,
    onKeyDown,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { premiumPress, buttonPress } = useHapticFeedback();

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      if (hapticFeedback) {
        if (variant === 'premium' || animation === 'full') {
          await premiumPress();
        } else {
          await buttonPress();
        }
      }

      if (pulseOnClick) {
        const target = event.currentTarget;
        target.classList.add('animate-bounce-press');
        setTimeout(() => {
          target.classList.remove('animate-bounce-press');
        }, 200);
      }

      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      
      // Handle Enter and Space keys for keyboard navigation
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (hapticFeedback) {
          buttonPress();
        }
        // Trigger click programmatically
        event.currentTarget.click();
      }
      
      onKeyDown?.(event);
    };

    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        role={role}
        tabIndex={disabled ? -1 : (tabIndex ?? 0)}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton, premiumButtonVariants };