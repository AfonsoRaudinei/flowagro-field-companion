import React from 'react';
import { SimpleBaseMap } from '@/components/maps/SimpleBaseMap';
import { PremiumMapControls } from '@/components/maps/PremiumMapControls';
import { PremiumCameraButton } from '@/components/maps/PremiumCameraButton';
import { NavigationControlsHub } from '@/components/maps/NavigationControlsHub';
import { DrawingToolsPanel } from '@/components/maps/DrawingToolsPanel';
import { EnhancedMapClickPopover } from '@/components/maps/EnhancedMapClickPopover';
import { DiagnosticPanel } from '@/components/maps/DiagnosticPanel';
import { TemporalNavigator } from '@/components/maps/TemporalNavigator';
import { TileLoadingOptimizer } from '@/components/maps/TileLoadingOptimizer';
import { MobileRenderOptimizer } from '@/components/maps/MobileRenderOptimizer';
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
      {/* Simple Base Map for Testing */}
      <SimpleBaseMap 
        className="w-full h-full absolute inset-0"
      />

      {/* Performance Optimization */}
      <TileLoadingOptimizer 
        showDebugInfo={false}
        enablePreloading={true}
      />
      <MobileRenderOptimizer 
        showDebugPanel={false}
        autoOptimize={true}
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

      {/* Enhanced Contextual Data Layer */}
      {/* Removed DrawingToolsPanel from here - it's handled in TechnicalMap now */}
      
      <EnhancedMapClickPopover
        className="pointer-events-auto"
        onAddPin={(coordinates) => console.log('Add pin at:', coordinates)}
        onAnalyzeArea={(coordinates) => console.log('Analyze area at:', coordinates)}
        onViewHistory={(coordinates) => console.log('View history at:', coordinates)}
      />
      
      <DiagnosticPanel 
        position="bottom"
        className="pointer-events-auto mb-20 lg:mb-4"
      />
      
      <TemporalNavigator 
        position="bottom"
        className="pointer-events-auto"
        onDateChange={(date) => console.log('Date changed to:', date)}
        onDataExport={(data) => console.log('Exporting data:', data)}
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