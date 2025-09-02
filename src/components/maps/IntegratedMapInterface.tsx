import React from 'react';
import { BaseMap } from '@/components/maps/BaseMap';
import { PremiumMapControls } from '@/components/maps/PremiumMapControls';
import { PremiumCameraButton } from '@/components/maps/PremiumCameraButton';
import { NavigationControlsHub } from '@/components/maps/NavigationControlsHub';
import { MapInfoPopover } from '@/components/maps/MapInfoPopover';
import { TemporalTimelineSlider } from '@/components/maps/TemporalTimelineSlider';
import { RealTimeMetricsPanel } from '@/components/maps/RealTimeMetricsPanel';
import { usePremiumMapAnimations } from '@/hooks/usePremiumMapAnimations';
import { cn } from '@/lib/utils';

interface IntegratedMapInterfaceProps {
  className?: string;
  farmId?: string;
  farmName?: string;
  onPhotoCapture?: (photoData: string, location?: { latitude: number; longitude: number }) => void;
  onMapStyleChange?: (style: string) => void;
  showAdvancedNavigation?: boolean;
  navigationLayout?: 'default' | 'compact' | 'mobile';
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
  onMapStyleChange,
  showAdvancedNavigation = true,
  navigationLayout = 'default'
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
        showNavigation={!showAdvancedNavigation} // Use advanced navigation instead
        showFullscreen={false} // Handled by PremiumMapControls
        showGeolocate={false}  // Integrated into advanced navigation
      />

      {/* Advanced Navigation Controls Hub */}
      {showAdvancedNavigation && (
        <NavigationControlsHub
          layout={navigationLayout}
          showZoomIndicator={true}
          showCompass={true}
          showLocationTracker={true}
          showMiniMap={true}
        />
      )}

      {/* Premium Controls Layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: getZIndex('controls') }}
      >
        <div className="pointer-events-auto">
          <PremiumMapControls
            className={showAdvancedNavigation ? "left-4" : ""}
            showStyleSelector={true}
            showResetView={!showAdvancedNavigation} // Hide if advanced navigation is active
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

      {/* Contextual Data Layer */}
      <MapInfoPopover />
      
      <RealTimeMetricsPanel 
        position="top-right"
        className="pointer-events-auto"
      />
      
      <TemporalTimelineSlider 
        className="absolute bottom-4 left-4 right-4 pointer-events-auto"
      />

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