import React from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useZoomControl } from '@/hooks/useZoomControl';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomLevelIndicatorProps {
  className?: string;
  showZoomButtons?: boolean;
  showPresets?: boolean;
}

const ZOOM_PRESETS = [
  { label: 'Brasil', zoom: 4, icon: Maximize2 },
  { label: 'Região', zoom: 8, icon: Maximize2 },
  { label: 'Fazenda', zoom: 12, icon: Maximize2 },
  { label: 'Campo', zoom: 15, icon: Maximize2 },
];

export const ZoomLevelIndicator: React.FC<ZoomLevelIndicatorProps> = ({
  className,
  showZoomButtons = true,
  showPresets = false
}) => {
  const { map, isReady } = useMapInstance();
  const { 
    currentZoom, 
    zoomProgress, 
    zoomIn, 
    zoomOut, 
    setZoomLevel,
    isZooming 
  } = useZoomControl();

  if (!isReady || !map) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-30",
        "flex flex-col gap-2",
        "transition-all duration-300",
        className
      )}
    >
      {/* Zoom Level Display */}
      <div className={cn(
        "bg-background/90 backdrop-blur-sm border border-border/50",
        "rounded-lg px-3 py-2 shadow-lg",
        "flex items-center gap-2 min-w-[120px]",
        isZooming && "scale-105"
      )}>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">
            Zoom: {Math.round(currentZoom * 10) / 10}
          </div>
          <div className="w-full bg-secondary/50 rounded-full h-1.5">
            <div 
              className={cn(
                "bg-primary h-full rounded-full transition-all duration-200",
                isZooming && "bg-primary-glow"
              )}
              style={{ width: `${zoomProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Zoom Control Buttons */}
      {showZoomButtons && (
        <div className={cn(
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "rounded-lg p-1 shadow-lg",
          "flex flex-col gap-1"
        )}>
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="hover"
            onClick={() => zoomIn()}
            disabled={currentZoom >= 22}
            ariaLabel="Ampliar mapa"
            className="h-8 w-8"
          >
            <ZoomIn className="h-3 w-3" />
          </PremiumButton>
          
          <PremiumButton
            variant="ghost"
            size="icon"
            animation="hover"
            onClick={() => zoomOut()}
            disabled={currentZoom <= 1}
            ariaLabel="Reduzir mapa"
            className="h-8 w-8"
          >
            <ZoomOut className="h-3 w-3" />
          </PremiumButton>
        </div>
      )}

      {/* Zoom Presets */}
      {showPresets && (
        <div className={cn(
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "rounded-lg p-1 shadow-lg",
          "flex flex-col gap-1 max-w-[80px]"
        )}>
          {ZOOM_PRESETS.map((preset) => (
            <PremiumButton
              key={preset.label}
              variant="ghost"
              size="sm"
              animation="press"
              onClick={() => setZoomLevel(preset.zoom)}
              className={cn(
                "text-xs h-6 px-2",
                Math.abs(currentZoom - preset.zoom) < 0.5 && "bg-primary/20 text-primary"
              )}
            >
              {preset.label}
            </PremiumButton>
          ))}
        </div>
      )}
    </div>
  );
};