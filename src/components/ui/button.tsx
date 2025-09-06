import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - iOS-inspired with FlowAgro design tokens
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-target",
  {
    variants: {
      variant: {
        // Standard variants with enhanced styling
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-ios-sm hover:shadow-ios-md active:scale-95 transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-ios-sm hover:shadow-ios-md active:scale-95",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-ios-sm hover:shadow-ios-md active:scale-95",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-ios-sm hover:shadow-ios-md active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all",
        link: "text-primary underline-offset-4 hover:underline active:scale-95",

        // iOS-specific variants
        "ios-primary": "bg-gradient-primary text-primary-foreground hover:shadow-ios-button active:scale-95 transition-all duration-200 rounded-lg font-semibold",
        "ios-secondary": "bg-secondary/80 backdrop-blur-sm text-secondary-foreground hover:bg-secondary border border-border/50 active:scale-95 rounded-lg",
        "ios-tinted": "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 active:scale-95 rounded-lg",
        "ios-filled": "bg-accent text-accent-foreground hover:bg-accent/90 shadow-ios-md active:scale-95 rounded-lg font-medium",

        // FlowAgro field-specific variants
        "field-primary": "bg-gradient-primary text-primary-foreground hover:shadow-field hover:-translate-y-0.5 active:translate-y-0 active:scale-98 rounded-lg font-semibold touch-target-lg",
        "field-secondary": "bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:shadow-field active:scale-98 rounded-lg border border-border/20",
        "field-danger": "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-field active:scale-98 rounded-lg font-medium",
        "field-success": "bg-success text-success-foreground hover:bg-success/90 hover:shadow-field active:scale-98 rounded-lg font-medium",

        // Floating action button variants
        "floating": "bg-primary text-primary-foreground hover:shadow-ios-lg hover:-translate-y-1 active:scale-95 rounded-full shadow-ios-md fixed bottom-6 right-6 w-14 h-14 p-0",
        "floating-secondary": "bg-secondary text-secondary-foreground hover:shadow-ios-lg hover:-translate-y-1 active:scale-95 rounded-full shadow-ios-md",

        // Tab bar variants
        "tab-active": "bg-primary/10 text-primary border-b-2 border-primary rounded-none pb-2 active:scale-98",
        "tab-inactive": "text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-none pb-2 active:scale-98",

        // Glass/blur variants
        "glass": "bg-card/80 backdrop-blur-md text-card-foreground border border-border/50 hover:bg-card/90 shadow-ios-sm active:scale-95 rounded-lg",
        "glass-primary": "bg-primary/20 backdrop-blur-md text-primary border border-primary/30 hover:bg-primary/30 shadow-ios-sm active:scale-95 rounded-lg",

        // Minimal variants for compact interfaces
        "minimal": "text-foreground hover:bg-accent/50 active:scale-95 rounded-md p-2",
        "minimal-destructive": "text-destructive hover:bg-destructive/10 active:scale-95 rounded-md p-2",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
        "icon-lg": "h-12 w-12 p-0 rounded-lg",
        
        // Field-optimized sizes (larger touch targets)
        "field": "h-12 px-6 py-3 text-base touch-target-lg",
        "field-sm": "h-10 px-4 py-2 text-sm touch-target",
        "field-lg": "h-14 px-8 py-4 text-lg touch-target-lg",
        
        // Tab bar sizes
        "tab": "h-12 px-6 rounded-none",
        
        // Floating sizes
        "floating": "h-14 w-14 p-0 rounded-full",
        "floating-lg": "h-16 w-16 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
