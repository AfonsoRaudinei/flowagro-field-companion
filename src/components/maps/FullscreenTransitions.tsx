import React from 'react';
import { useMap } from './MapProvider';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenTransitionsProps {
  children: React.ReactNode;
}

export const FullscreenTransitions: React.FC<FullscreenTransitionsProps> = ({ children }) => {
  const { fullscreenState, isTransitioning, orientation } = useMap();

  return (
    <div className={cn(
      "relative w-full h-full",
      // Transition classes
      "transition-all duration-300 ease-out",
      // State-based styling
      fullscreenState === 'entering' && "animate-spring scale-105",
      fullscreenState === 'exiting' && "animate-spring scale-95 opacity-90",
      // Orientation-based styling
      orientation === 'landscape' && "lg:scale-100",
      // Hardware acceleration
      "transform-gpu will-change-transform"
    )}>
      {children}
      
      {/* Loading Overlay */}
      {isTransitioning && (
        <div className={cn(
          "absolute inset-0 z-50",
          "flex items-center justify-center",
          "bg-background/80 backdrop-blur-sm",
          "animate-fade-in"
        )}>
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {fullscreenState === 'entering' ? 'Entrando em tela cheia...' : 'Saindo da tela cheia...'}
            </p>
          </div>
        </div>
      )}
      
      {/* Fullscreen State Indicator */}
      {fullscreenState !== 'idle' && !isTransitioning && (
        <div className={cn(
          "absolute top-4 right-4 z-40",
          "px-3 py-1 rounded-full",
          "bg-primary/10 border border-primary/20",
          "text-xs text-primary font-medium",
          "animate-slide-up"
        )}>
          {fullscreenState === 'entered' ? 'Tela Cheia' : 'Transição'}
        </div>
      )}
      
      {/* Orientation Indicator (Mobile) */}
      {orientation === 'landscape' && window.innerWidth < 768 && (
        <div className={cn(
          "absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40",
          "px-3 py-1 rounded-full",
          "bg-accent/10 border border-accent/20",
          "text-xs text-accent font-medium",
          "animate-slide-up"
        )}>
          Modo Paisagem
        </div>
      )}
    </div>
  );
};