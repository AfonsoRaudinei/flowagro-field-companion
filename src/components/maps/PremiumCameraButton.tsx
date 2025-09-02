import React, { useState, useCallback } from 'react';
import { Camera, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { PremiumButton } from '@/components/ui/premium-button';
import { usePremiumMapAnimations } from '@/hooks/usePremiumMapAnimations';
import { CameraService } from '@/services/cameraService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PremiumCameraButtonProps {
  onPhotoTaken?: (photoData: string, location?: { latitude: number; longitude: number }) => void;
  className?: string;
  farmId?: string;
  farmName?: string;
}

export const PremiumCameraButton: React.FC<PremiumCameraButtonProps> = ({
  onPhotoTaken,
  className,
  farmId,
  farmName
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null);
  const { 
    getControlPosition, 
    getZIndex, 
    getContextualClasses,
    animateMapInteraction,
    isFullscreen 
  } = usePremiumMapAnimations();
  const { toast } = useToast();

  const handleCameraCapture = useCallback(async () => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    await animateMapInteraction('zoom'); // Haptic feedback
    
    try {
      // Get current location
      const location = await CameraService.getCurrentLocation();
      
      // Take photo
      const photoData = await CameraService.takePhoto();
      
      if (photoData) {
        setLastCaptureTime(new Date());
        
        // Success feedback
        toast({
          title: "Foto capturada!",
          description: location 
            ? `Localização: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` 
            : "Localização não disponível",
          variant: "default",
        });
        
        onPhotoTaken?.(photoData, location || undefined);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: "Erro na captura",
        description: "Não foi possível acessar a câmera",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, animateMapInteraction, onPhotoTaken, toast]);

  const getCameraButtonVariant = useCallback(() => {
    if (isCapturing) return 'secondary';
    if (lastCaptureTime && Date.now() - lastCaptureTime.getTime() < 5000) {
      return 'premium'; // Show success state briefly
    }
    return 'default';
  }, [isCapturing, lastCaptureTime]);

  const getCameraButtonAnimation = useCallback(() => {
    if (isCapturing) return 'pulse';
    return 'full';
  }, [isCapturing]);

  const getCameraIcon = useCallback(() => {
    if (isCapturing) return Camera;
    if (lastCaptureTime && Date.now() - lastCaptureTime.getTime() < 5000) {
      return CheckCircle;
    }
    return Camera;
  }, [isCapturing, lastCaptureTime]);

  const CameraIcon = getCameraIcon();
  const controlPosition = getControlPosition('floating');

  return (
    <div
      className={cn(
        "fixed z-30", // Use integrated z-index system
        controlPosition.floating,
        getContextualClasses(),
        "transform transition-all duration-300",
        isFullscreen && "bottom-8 right-8", // Adjust for fullscreen
        className
      )}
      style={{ zIndex: getZIndex('overlay') }}
    >
      <PremiumButton
        variant={getCameraButtonVariant()}
        size="touch"
        animation={getCameraButtonAnimation()}
        disabled={isCapturing}
        onClick={handleCameraCapture}
        className={cn(
          "premium-card shadow-lg",
          "flex items-center gap-2",
          isCapturing && "animate-pulse-availability",
          lastCaptureTime && Date.now() - lastCaptureTime.getTime() < 5000 && "animate-hover-glow"
        )}
      >
        <CameraIcon className={cn(
          "h-5 w-5",
          isCapturing && "animate-spin",
          "premium-icon"
        )} />
        {!isFullscreen && (
          <span className="text-sm font-medium">
            {isCapturing 
              ? "Capturando..." 
              : lastCaptureTime && Date.now() - lastCaptureTime.getTime() < 5000
                ? "Sucesso!"
                : "Foto"
            }
          </span>
        )}
      </PremiumButton>
      
      {/* Location indicator */}
      {!isCapturing && (
        <div 
          className={cn(
            "absolute -top-2 -right-2",
            "w-4 h-4 rounded-full",
            "bg-accent text-accent-foreground",
            "flex items-center justify-center",
            "animate-pulse-glow",
            "shadow-sm"
          )}
          style={{ zIndex: getZIndex('tooltip') }}
        >
          <MapPin className="h-2 w-2" />
        </div>
      )}
    </div>
  );
};