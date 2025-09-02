import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  Minus,
  Compass,
  Locate,
  CloudRain,
  Thermometer,
  Wind
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MicroFABsProps {
  // Zoom Controls
  showZoomControls?: boolean;
  currentZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  
  // Location Controls
  showLocationButton?: boolean;
  locationActive?: boolean;
  onLocationToggle?: () => void;
  
  // Compass
  showCompass?: boolean;
  compassHeading?: number;
  onCompassClick?: () => void;
  
  // Weather (contextual)
  showWeather?: boolean;
  weatherData?: {
    temp?: number;
    humidity?: number;
    windSpeed?: number;
    condition?: string;
  };
  onWeatherClick?: () => void;
  
  className?: string;
}

export const MicroFABs: React.FC<MicroFABsProps> = ({
  showZoomControls = true,
  currentZoom,
  onZoomIn,
  onZoomOut,
  
  showLocationButton = true,
  locationActive = false,
  onLocationToggle,
  
  showCompass = false,
  compassHeading = 0,
  onCompassClick,
  
  showWeather = false,
  weatherData,
  onWeatherClick,
  
  className
}) => {
  return (
    <div className={cn("fixed top-4 right-4 z-30", className)}>
      <div className="flex flex-col space-y-2">
        
        {/* Zoom Controls */}
        {showZoomControls && (
          <div className="flex flex-col space-y-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={onZoomIn}
              className={cn(
                "h-10 w-10 rounded-t-xl rounded-b-none shadow-lg",
                "bg-background/90 backdrop-blur-sm border border-border/50",
                "hover:bg-primary/10 hover:shadow-xl",
                "transition-all duration-200"
              )}
              aria-label="Zoom in"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            {/* Zoom Level Indicator */}
            {currentZoom && (
              <div className={cn(
                "h-8 w-10 px-1",
                "bg-background/90 backdrop-blur-sm border-x border-border/50",
                "flex items-center justify-center text-xs font-medium"
              )}>
                {Math.round(currentZoom)}
              </div>
            )}
            
            <Button
              variant="secondary"
              size="icon"
              onClick={onZoomOut}
              className={cn(
                "h-10 w-10 rounded-b-xl rounded-t-none shadow-lg",
                "bg-background/90 backdrop-blur-sm border border-border/50",
                "hover:bg-primary/10 hover:shadow-xl",
                "transition-all duration-200"
              )}
              aria-label="Zoom out"
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Location Button */}
        {showLocationButton && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onLocationToggle}
            className={cn(
              "h-10 w-10 rounded-xl shadow-lg relative",
              "bg-background/90 backdrop-blur-sm border border-border/50",
              locationActive 
                ? "bg-primary/20 border-primary/50" 
                : "hover:bg-primary/10 hover:shadow-xl",
              "transition-all duration-200"
            )}
            aria-label="Minha localização"
          >
            <Locate className={cn(
              "w-4 h-4",
              locationActive && "text-primary"
            )} />
            
            {locationActive && (
              <div className="absolute -top-1 -right-1">
                <div className="h-3 w-3 bg-primary rounded-full border-2 border-background animate-pulse" />
              </div>
            )}
          </Button>
        )}

        {/* Compass */}
        {showCompass && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onCompassClick}
            className={cn(
              "h-10 w-10 rounded-xl shadow-lg",
              "bg-background/90 backdrop-blur-sm border border-border/50",
              "hover:bg-primary/10 hover:shadow-xl",
              "transition-all duration-200"
            )}
            style={{
              transform: `rotate(${-compassHeading}deg)`
            }}
            aria-label="Bússola"
          >
            <Compass className="w-4 h-4" />
          </Button>
        )}

        {/* Weather Widget (Contextual) */}
        {showWeather && weatherData && (
          <div className={cn(
            "p-3 rounded-xl shadow-lg min-w-[80px]",
            "bg-background/90 backdrop-blur-sm border border-border/50",
            "cursor-pointer hover:bg-primary/10 hover:shadow-xl",
            "transition-all duration-200"
          )}
          onClick={onWeatherClick}
          >
            <div className="flex flex-col items-center space-y-1">
              {weatherData.condition === 'rain' && <CloudRain className="w-5 h-5 text-blue-500" />}
              {weatherData.condition === 'sunny' && <Thermometer className="w-5 h-5 text-orange-500" />}
              
              {weatherData.temp && (
                <div className="text-xs font-medium">
                  {weatherData.temp}°C
                </div>
              )}
              
              {weatherData.windSpeed && (
                <div className="flex items-center space-x-1">
                  <Wind className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {weatherData.windSpeed}km/h
                  </span>
                </div>
              )}
              
              {weatherData.humidity && (
                <Badge variant="outline" className="text-xs px-1">
                  {weatherData.humidity}%
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};