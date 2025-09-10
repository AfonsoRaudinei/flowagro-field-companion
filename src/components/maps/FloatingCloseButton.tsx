import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { useOrientationBehavior } from '@/hooks/useOrientationDetector';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

interface FloatingCloseButtonProps {
  className?: string;
}

export const FloatingCloseButton: React.FC<FloatingCloseButtonProps> = ({
  className
}) => {
  const { navigate } = useOptimizedNavigation();
  const { isLandscape, isMobile } = useOrientationBehavior();

  const handleClose = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptics not available - ignore
    }
    
    navigate('/dashboard');
  };

  return (
    <div className={cn(
      "fixed z-40 transition-all duration-300",
      // Base positioning - bottom left
      "bottom-6 left-6",
      // Mobile landscape adjustments
      isMobile && isLandscape && "bottom-4 left-4",
      // Additional positioning adjustments
      "pointer-events-auto",
      className
    )}>
      <Button
        onClick={handleClose}
        size="icon"
        variant="ghost"
        className={cn(
          // Base styling
          "h-14 w-14 rounded-full",
          "bg-background/90 backdrop-blur-sm",
          "border-2 border-border",
          "shadow-lg hover:shadow-xl",
          "transition-all duration-300",
          // Hover effects
          "hover:bg-background/95 hover:scale-105",
          "active:scale-95",
          // Visual enhancements
          "group relative overflow-hidden",
        )}
        aria-label="Fechar mapa"
      >
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
        
        {/* Icon */}
        <X className="h-6 w-6 text-foreground relative z-10 transition-transform duration-200 group-hover:rotate-90" />
        
        {/* Ripple effect on click */}
        <div className="absolute inset-0 rounded-full bg-primary/10 scale-0 group-active:scale-100 transition-transform duration-200" />
      </Button>
    </div>
  );
};