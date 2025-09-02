import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useMap } from './MapProvider';
import { useOrientationBehavior } from '@/hooks/useOrientationDetector';
import { CameraService } from '@/services/cameraService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
      setIsCapturing(true);
      onCaptureStart?.();
      
      // Get current location
      const location = await CameraService.getCurrentLocation();
      
      if (!location) {
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
        toast({
          title: "Foto capturada!",
          description: "Foto salva com sucesso com coordenadas GPS.",
        });
      }
    } catch (error) {
      console.error('Camera capture error:', error);
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
          // Base styles - premium iOS design
          "h-14 w-14 rounded-full shadow-xl transition-all duration-200",
          "bg-primary/90 backdrop-blur-sm border border-primary-foreground/10",
          "hover:bg-primary hover:scale-110 hover:shadow-2xl",
          "active:scale-95 active:shadow-lg",
          "disabled:opacity-50 disabled:scale-100",
          
          // Pulse animation when idle
          !isCapturing && !isTransitioning && "animate-pulse",
          
          // Loading state
          isCapturing && "scale-105 shadow-2xl",
          
          // Mobile touch optimization
          isMobile && "touch-manipulation"
        )}
        aria-label="Capturar foto de campo"
      >
        {isCapturing ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
        ) : (
          <Camera className="h-6 w-6 text-primary-foreground" />
        )}
      </Button>
      
      {/* Ripple effect overlay */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-300",
        "bg-primary/20 scale-0 opacity-0",
        isCapturing && "scale-150 opacity-100"
      )} />
    </div>
  );
};