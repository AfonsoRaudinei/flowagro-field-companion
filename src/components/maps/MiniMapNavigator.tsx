import React, { useEffect, useRef, useState } from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useMiniMap } from '@/hooks/useMiniMap';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface MiniMapNavigatorProps {
  className?: string;
  width?: number;
  height?: number;
  showToggle?: boolean;
  defaultVisible?: boolean;
}

export const MiniMapNavigator: React.FC<MiniMapNavigatorProps> = ({
  className,
  width = 160,
  height = 120,
  showToggle = true,
  defaultVisible = true
}) => {
  const { map: parentMap, isReady } = useMapInstance();
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    miniMap,
    isLoaded,
    viewportBounds,
    initializeMiniMap,
    cleanup
  } = useMiniMap(width, height);

  // Initialize mini-map when container is ready
  useEffect(() => {
    if (!isReady || !parentMap || !isVisible || !miniMapContainerRef.current) return;

    initializeMiniMap(miniMapContainerRef.current, parentMap);

    return cleanup;
  }, [isReady, parentMap, isVisible, initializeMiniMap, cleanup]);

  // Handle click to navigate on mini-map
  useEffect(() => {
    if (!miniMap || !parentMap || !isLoaded) return;

    const handleMiniMapClick = (e: mapboxgl.MapMouseEvent) => {
      const lngLat = e.lngLat;
      parentMap.flyTo({
        center: [lngLat.lng, lngLat.lat],
        duration: 1000
      });
    };

    miniMap.on('click', handleMiniMapClick);

    return () => {
      miniMap.off('click', handleMiniMapClick);
    };
  }, [miniMap, parentMap, isLoaded]);

  if (!isReady) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-20 z-30",
        "transition-all duration-300",
        !isVisible && "pointer-events-none",
        className
      )}
    >
      {/* Toggle Button */}
      {showToggle && (
        <div className="absolute -top-2 -right-2 z-40">
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="hover"
            onClick={() => setIsVisible(!isVisible)}
            ariaLabel={isVisible ? "Ocultar mini-mapa" : "Mostrar mini-mapa"}
            className="h-6 w-6 bg-background/90 backdrop-blur-sm border border-border/50"
          >
            {isVisible ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </PremiumButton>
        </div>
      )}

      {/* Mini-Map Container */}
      <div
        className={cn(
          "relative rounded-lg overflow-hidden shadow-lg border border-border/50",
          "bg-background/90 backdrop-blur-sm",
          "transition-all duration-300 cursor-pointer",
          "hover:shadow-xl hover:border-border",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{ width, height }}
      >
        {/* Mini-Map Canvas */}
        <div
          ref={miniMapContainerRef}
          className="w-full h-full"
        />

        {/* Viewport Indicator Overlay */}
        {isLoaded && viewportBounds && (
          <div className="absolute inset-0 pointer-events-none">
            <svg 
              className="w-full h-full"
              viewBox={`0 0 ${width} ${height}`}
            >
              {/* Viewport Rectangle */}
              <rect
                x={viewportBounds.x}
                y={viewportBounds.y}
                width={viewportBounds.width}
                height={viewportBounds.height}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              {/* Viewport Fill */}
              <rect
                x={viewportBounds.x}
                y={viewportBounds.y}
                width={viewportBounds.width}
                height={viewportBounds.height}
                fill="rgb(59, 130, 246)"
                opacity="0.2"
              />
            </svg>
          </div>
        )}

        {/* Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Click Hint */}
        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground bg-background/80 px-1 rounded pointer-events-none">
          clique para navegar
        </div>
      </div>
    </div>
  );
};