import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useMap } from './MapProvider';
import { useOrientationBehavior } from '@/hooks/useOrientationDetector';
import { CameraService } from '@/services/cameraService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface FloatingCameraButtonProps {
  onCaptureStart?: () => void;
  className?: string;
}

export const FloatingCameraButton: React.FC<FloatingCameraButtonProps> = ({
  onCaptureStart,
  className
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const mapContext = useMap();
  const { isLandscape, isMobile } = useOrientationBehavior();
  const { toast } = useToast();

  // Defensive check - don't render if map context isn't available
  if (!mapContext) {
    return null;
  }

  const { isFullscreen, isTransitioning } = mapContext;

  const handleCameraCapture = async () => {
    try {
      // Haptic feedback on button press
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      
      setIsCapturing(true);
      onCaptureStart?.();
      
      // Get current location
      const location = await CameraService.getCurrentLocation();
      
      if (!location) {
        // Error haptic feedback
        if (isMobile) {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
        toast({
          title: "Localização indisponível",
          description: "Não foi possível obter a localização atual.",
          variant: "destructive"
        });
        return;
      }

      // Take photo
      const photoUrl = await CameraService.takePhoto();
      
      if (photoUrl) {
        // Success haptic feedback
        if (isMobile) {
          await Haptics.impact({ style: ImpactStyle.Light });
        }
        toast({
          title: "Foto capturada!",
          description: "Foto salva com sucesso com coordenadas GPS.",
        });
      }
    } catch (error) {
      logger.error('Camera capture error', { error });
      // Error haptic feedback
      if (isMobile) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      toast({
        title: "Erro na captura",
        description: "Não foi possível capturar a foto.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div
      className={cn(
        // Base positioning - floating over map
        "fixed z-50 transition-all duration-500 ease-out",
        
        // Mobile Portrait - Optimized for thumb reach (bottom-right, comfortable distance from edges)
        isMobile && !isLandscape && !isFullscreen && "bottom-20 right-4",
        isMobile && !isLandscape && isFullscreen && "bottom-8 right-6",
        
        // Mobile Landscape - Avoid control overlap
        isMobile && isLandscape && !isFullscreen && "bottom-4 right-20", // Away from map controls
        isMobile && isLandscape && isFullscreen && "bottom-6 left-6", // Left side in fullscreen
        
        // Desktop - Standard positioning
        !isMobile && !isFullscreen && "bottom-6 right-6",
        !isMobile && isFullscreen && "bottom-8 right-8",
        
        // Smooth transitions between positions
        "transform-gpu will-change-transform",
        
        // Hide during transitions with enhanced animation
        isTransitioning && "opacity-0 scale-90 pointer-events-none transition-all duration-300",
        
        className
      )}
    >
      <Button
        onClick={handleCameraCapture}
        disabled={isCapturing || isTransitioning}
        size="icon"
        className={cn(
          // Base styles - premium iOS design with enhanced shadows
          "relative h-14 w-14 rounded-full shadow-lg backdrop-blur-md border border-white/20",
          "bg-gradient-to-br from-primary/95 to-primary/85",
          "transition-all duration-300 ease-out transform-gpu will-change-transform",
          
          // Premium hover effects - perfect timing and scaling
          "hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.15] hover:from-primary hover:to-primary/90",
          "hover:border-white/30 hover:-translate-y-0.5",
          
          // Active state - pressed animation with perfect feedback
          "active:scale-95 active:shadow-md active:translate-y-0 active:duration-100",
          "active:from-primary/80 active:to-primary/70",
          
          // Disabled state - subtle but clear
          "disabled:opacity-60 disabled:scale-100 disabled:shadow-lg disabled:translate-y-0",
          "disabled:hover:scale-100 disabled:hover:shadow-lg disabled:cursor-not-allowed",
          
          // Pulse animation when available (refined timing)
          !isCapturing && !isTransitioning && !mapContext.isFullscreen && 
          "animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] hover:animate-none",
          
          // Loading state - enhanced with breathing effect
          isCapturing && "scale-110 shadow-2xl shadow-primary/40 animate-[pulse_1.5s_ease-in-out_infinite]",
          
          // Fullscreen state transitions - smooth morphing
          isFullscreen && "shadow-xl border-white/25",
          
          // Mobile optimizations
          isMobile && "touch-manipulation select-none",
          
          // Focus states for accessibility
          "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background/50"
        )}
        aria-label="Capturar foto de campo"
        onMouseDown={() => {
          // Immediate visual feedback on press
          if (!isMobile) {
            const button = document.activeElement as HTMLElement;
            button?.style.setProperty('--tw-scale-x', '0.95');
            button?.style.setProperty('--tw-scale-y', '0.95');
          }
        }}
        onMouseUp={() => {
          // Reset scale on release
          if (!isMobile) {
            const button = document.activeElement as HTMLElement;
            button?.style.removeProperty('--tw-scale-x');
            button?.style.removeProperty('--tw-scale-y');
          }
        }}
      >
        <div className={cn(
          // Icon container with subtle animations
          "relative z-10 transition-all duration-200",
          isCapturing && "animate-pulse"
        )}>
          {isCapturing ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground drop-shadow-sm" />
          ) : (
            <Camera className="h-6 w-6 text-primary-foreground drop-shadow-sm" />
          )}
        </div>
        
        {/* Animated background glow */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent",
          "transition-all duration-300 opacity-0",
          "group-hover:opacity-100"
        )} />
      </Button>
      
      {/* Enhanced ripple effect with perfect timing */}
      <div className={cn(
        "absolute inset-0 rounded-full pointer-events-none",
        "bg-gradient-radial from-primary/30 via-primary/10 to-transparent",
        "scale-0 opacity-0 transition-all duration-500 ease-out",
        isCapturing && "scale-[2] opacity-100 duration-700"
      )} />
      
      {/* Availability indicator - subtle breathing glow */}
      <div className={cn(
        "absolute inset-0 rounded-full pointer-events-none",
        "bg-primary/20 blur-sm scale-110",
        "opacity-0 transition-all duration-1000",
        !isCapturing && !isTransitioning && "animate-[pulse_4s_ease-in-out_infinite] opacity-60"
      )} />
    </div>
  );
};