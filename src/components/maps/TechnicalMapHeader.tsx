import React from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation';
import { useOrientationBehavior } from '@/hooks/useOrientationDetector';
import { cn } from '@/lib/utils';

export const TechnicalMapHeader: React.FC = () => {
  const { navigate } = useOptimizedNavigation();
  const { isMobile, isLandscape } = useOrientationBehavior();

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm",
      // Responsive height
      "h-12 sm:h-14",
      // Enhanced backdrop for mobile
      isMobile && "backdrop-blur-sm bg-background/95"
    )}>
      <div className={cn(
        "flex items-center justify-between h-full",
        // Responsive padding
        "px-3 sm:px-4 md:px-6"
      )}>
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className={cn(
            // Responsive size
            "h-8 w-8 sm:h-10 sm:w-10",
            // Enhanced mobile touch target
            isMobile && "active:scale-95 transition-transform duration-150"
          )}
          aria-label="Voltar"
        >
          <ArrowLeft className={cn(
            // Responsive icon size
            "h-4 w-4 sm:h-5 sm:w-5"
          )} />
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSettings}
          className={cn(
            // Responsive size
            "h-8 w-8 sm:h-10 sm:w-10",
            // Enhanced mobile touch target
            isMobile && "active:scale-95 transition-transform duration-150"
          )}
          aria-label="Configurações"
        >
          <Settings className={cn(
            // Responsive icon size
            "h-4 w-4 sm:h-5 sm:w-5"
          )} />
        </Button>
      </div>
    </header>
  );
};