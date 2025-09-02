import React, { useEffect, useRef } from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useCompass } from '@/hooks/useCompass';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';
import { Navigation, RotateCcw } from 'lucide-react';

interface CompassControlProps {
  className?: string;
  autoReset?: boolean;
  autoResetDelay?: number;
  showResetButton?: boolean;
  showMagneticDeclination?: boolean;
}

export const CompassControl: React.FC<CompassControlProps> = ({
  className,
  autoReset = true,
  autoResetDelay = 30000, // 30 seconds
  showResetButton = true,
  showMagneticDeclination = false
}) => {
  const { map, isReady } = useMapInstance();
  const {
    bearing,
    magneticDeclination,
    isNorthAligned,
    resetToNorth,
    startAutoReset,
    stopAutoReset
  } = useCompass(autoReset, autoResetDelay);

  const compassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isReady || !map) return;

    const handleInteraction = () => {
      if (autoReset) {
        startAutoReset();
      }
    };

    // Listen for map interactions to restart auto-reset timer
    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);
    map.on('rotatestart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);  
      map.off('rotatestart', handleInteraction);
      stopAutoReset();
    };
  }, [map, isReady, autoReset, startAutoReset, stopAutoReset]);

  if (!isReady || !map) {
    return null;
  }

  const compassRotation = -bearing; // Counter-rotate compass

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-30",
        "transition-all duration-300",
        className
      )}
    >
      {/* Compass Circle */}
      <div 
        ref={compassRef}
        className={cn(
          "relative w-16 h-16 rounded-full",
          "bg-background/90 backdrop-blur-sm",
          "border-2 border-border/50 shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-500",
          isNorthAligned && "border-primary/50 shadow-primary/20"
        )}
      >
        {/* Compass Rose Background */}
        <div className="absolute inset-1 rounded-full border border-border/30" />
        
        {/* North Indicator (Fixed) */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
          <div className={cn(
            "w-1 h-3 rounded-full",
            isNorthAligned ? "bg-primary" : "bg-muted-foreground"
          )} />
        </div>

        {/* Compass Needle (Rotates) */}
        <div 
          className="absolute inset-2 flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${compassRotation}deg)` }}
        >
          <Navigation className={cn(
            "h-6 w-6 transition-colors duration-300",
            isNorthAligned ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* Bearing Text */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-xs font-mono text-muted-foreground">
            {Math.round(bearing)}°
          </div>
        </div>
      </div>

      {/* Magnetic Declination (optional) */}
      {showMagneticDeclination && magneticDeclination !== null && (
        <div className="mt-2 text-center">
          <div className="text-xs text-muted-foreground">
            Mag: {magneticDeclination > 0 ? '+' : ''}{Math.round(magneticDeclination)}°
          </div>
        </div>
      )}

      {/* Reset Button */}
      {showResetButton && (
        <div className="mt-2 flex justify-center">
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="bounce"
            onClick={resetToNorth}
            disabled={isNorthAligned}
            ariaLabel="Resetar orientação para norte"
            className="h-8 w-8"
          >
            <RotateCcw className="h-3 w-3" />
          </PremiumButton>
        </div>
      )}
    </div>
  );
};