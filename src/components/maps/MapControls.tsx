import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMap } from './MapProvider';
import { MapStyle, MAP_STYLES } from '@/services/mapService';
import { 
  Layers, 
  RotateCcw, 
  Maximize2, 
  Minimize2,
  Navigation,
  Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapControlsProps {
  className?: string;
  showStyleSelector?: boolean;
  showResetView?: boolean;
  showFullscreenToggle?: boolean;
  vertical?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  className,
  showStyleSelector = true,
  showResetView = true,
  showFullscreenToggle = true,
  vertical = false
}) => {
  const { 
    map, 
    currentStyle, 
    setStyle, 
    isFullscreen, 
    setFullscreen,
    showControls 
  } = useMap();

  if (!showControls) return null;

  const handleStyleChange = (style: MapStyle) => {
    setStyle(style);
  };

  const handleResetView = () => {
    if (map) {
      map.flyTo({
        center: [-15.7975, -47.8919], // Brasília
        zoom: 4,
        pitch: 0,
        bearing: 0,
        duration: 1500
      });
    }
  };

  const handleFullscreenToggle = async () => {
    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  const handleFlyToLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 15,
            duration: 2000
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <Card className={cn(
      "absolute top-4 left-4 z-10 p-2",
      vertical ? "flex flex-col space-y-2" : "flex items-center space-x-2",
      className
    )}>
      {showStyleSelector && (
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <Select value={currentStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streets">Streets</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showResetView && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleFlyToLocation}
        title="Go to my location"
      >
        <Navigation className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => map?.easeTo({ bearing: 0, pitch: 0 })}
        title="Reset bearing"
      >
        <Compass className="w-4 h-4" />
      </Button>

      {showFullscreenToggle && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreenToggle}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      )}
    </Card>
  );
};