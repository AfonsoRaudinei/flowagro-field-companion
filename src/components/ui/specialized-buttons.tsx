import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Specialized button components for specific use cases
export interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'default' | 'lg';
  children: React.ReactNode;
}

export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ className, size = 'default', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-full shadow-ios-lg hover:shadow-ios-lg hover:-translate-y-1 active:scale-95 transition-all duration-200 z-50",
          size === 'lg' ? "h-16 w-16 p-0" : "h-14 w-14 p-0",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
FloatingActionButton.displayName = "FloatingActionButton"

export interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

export const TabButton = React.forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ className, active = false, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "h-12 px-6 rounded-none pb-2 transition-all duration-200 active:scale-98",
          active 
            ? "bg-primary/10 text-primary border-b-2 border-primary" 
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
TabButton.displayName = "TabButton"

export interface FieldButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
}

export const FieldButton = React.forwardRef<HTMLButtonElement, FieldButtonProps>(
  ({ className, variant = 'primary', size = 'default', children, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-gradient-primary text-primary-foreground hover:shadow-field",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:shadow-field border border-border/20",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-field",
      success: "bg-success text-success-foreground hover:bg-success/90 hover:shadow-field"
    }
    
    const sizeStyles = {
      sm: "h-10 px-4 py-2 text-sm touch-target",
      default: "h-12 px-6 py-3 text-base touch-target-lg", 
      lg: "h-14 px-8 py-4 text-lg touch-target-lg"
    }
    
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
FieldButton.displayName = "FieldButton"

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
  children: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-card/80 text-card-foreground border-border/50 hover:bg-card/90",
      primary: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
    }
    
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-lg backdrop-blur-md border shadow-ios-sm transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
GlassButton.displayName = "GlassButton"