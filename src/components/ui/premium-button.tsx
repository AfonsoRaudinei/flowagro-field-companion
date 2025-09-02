import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const premiumButtonVariants = cva(
  "premium-button inline-flex items-center justify-center whitespace-nowrap rounded-md text-ios-base font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground premium-hover premium-press",
        destructive: "bg-destructive text-destructive-foreground premium-hover premium-press",
        outline: "border border-input bg-background premium-hover premium-press hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground premium-hover premium-press hover:bg-secondary/80",
        ghost: "premium-hover premium-press hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 premium-hover hover:underline",
        premium: "bg-gradient-primary text-primary-foreground premium-hover premium-press premium-glow shadow-lg",
        glow: "bg-primary text-primary-foreground premium-hover premium-press glow-pulse"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        touch: "h-12 px-6 py-3" // iOS touch target size
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
    onClick,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { premiumPress, buttonPress } = useHapticFeedback();

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
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

    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton, premiumButtonVariants };