import React from 'react';
import { BaseMap } from '@/components/maps/BaseMap';
import { PremiumMapControls } from '@/components/maps/PremiumMapControls';
import { PremiumCameraButton } from '@/components/maps/PremiumCameraButton';
import { usePremiumMapAnimations } from '@/hooks/usePremiumMapAnimations';
import { cn } from '@/lib/utils';

interface IntegratedMapInterfaceProps {
  className?: string;
  farmId?: string;
  farmName?: string;
  onPhotoCapture?: (photoData: string, location?: { latitude: number; longitude: number }) => void;
  onMapStyleChange?: (style: string) => void;
}

/**
 * Componente que integra todos os elementos do mapa premium:
 * - Sistema de animações contextual
 * - Controles premium responsivos  
 * - Camera service integrado
 * - Z-index system consistente
 * - Orientação e fullscreen automáticos
 */
export const IntegratedMapInterface: React.FC<IntegratedMapInterfaceProps> = ({
  className,
  farmId,
  farmName,
  onPhotoCapture,
  onMapStyleChange
}) => {
  const {
    getContextualClasses,
    getZIndex,
    isFullscreen,
    map
  } = usePremiumMapAnimations();

  const handleResetView = () => {
    if (!map) return;
    
    // Reset to default view with smooth animation
    map.flyTo({
      center: [-47.9292, -15.7801], // Brasília coordinates as default
      zoom: 4,
      pitch: 0,
      bearing: 0,
      duration: 1000
    });
  };

  return (
    <div
      className={cn(
        "relative w-full h-full",
        "overflow-hidden",
        getContextualClasses(),
        className
      )}
      style={{ zIndex: getZIndex('map') }}
    >
      {/* Base Map */}
      <BaseMap 
        className="w-full h-full absolute inset-0"
        showNavigation={true}
        showFullscreen={false} // Handled by PremiumMapControls
        showGeolocate={false}  // Integrated into camera service
      />

      {/* Premium Controls Layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: getZIndex('controls') }}
      >
        <div className="pointer-events-auto">
          <PremiumMapControls
            showStyleSelector={true}
            showResetView={true}
            showFullscreenToggle={true}
            vertical={true}
            onResetView={handleResetView}
            onStyleChange={onMapStyleChange}
          />
        </div>
      </div>

      {/* Camera Integration Layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: getZIndex('overlay') }}
      >
        <div className="pointer-events-auto">
          <PremiumCameraButton
            farmId={farmId}
            farmName={farmName}
            onPhotoTaken={onPhotoCapture}
          />
        </div>
      </div>

      {/* Fullscreen Overlay (for enhanced transitions) */}
      {isFullscreen && (
        <div 
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-b from-transparent via-transparent to-background/5",
            "pointer-events-none",
            "animate-fade-in"
          )}
          style={{ zIndex: getZIndex('overlay') + 1 }}
        />
      )}
    </div>
  );
};