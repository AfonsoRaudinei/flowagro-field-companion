import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUserLocation } from '@/hooks/useUserLocation';
import { MapPin, Satellite, Clock, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationFooterProps {
  className?: string;
  position?: 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export const LocationFooter: React.FC<LocationFooterProps> = ({
  className,
  position = 'bottom-center'
}) => {
  const { 
    currentPosition, 
    accuracy, 
    speed, 
    heading,
    isTracking,
    error 
  } = useUserLocation();

  if (!currentPosition && !isTracking) return null;

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4', 
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={cn(
      "absolute z-30 pointer-events-none",
      positionClasses[position],
      className
    )}>
      <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2 shadow-lg">
        <div className="flex items-center gap-4 text-sm">
          {/* Status GPS */}
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5",
              currentPosition ? "text-green-600" : "text-yellow-600"
            )}>
              <MapPin className="w-3 h-3" />
              <Badge 
                variant={currentPosition ? "default" : "secondary"}
                className="text-xs h-5"
              >
                {isTracking ? (currentPosition ? "GPS Ativo" : "Buscando...") : "GPS Inativo"}
              </Badge>
            </div>
          </div>

          {/* Coordenadas */}
          {currentPosition && (
            <>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-muted-foreground">Lat:</span>
                <span className="font-medium">{currentPosition.latitude.toFixed(6)}</span>
              </div>
              
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-muted-foreground">Lng:</span>
                <span className="font-medium">{currentPosition.longitude.toFixed(6)}</span>
              </div>
            </>
          )}

          {/* Precisão */}
          {accuracy && (
            <div className="flex items-center gap-1.5 text-xs">
              <Satellite className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">±{accuracy.toFixed(0)}m</span>
            </div>
          )}

          {/* Velocidade */}
          {speed && speed > 0.5 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Navigation className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">{(speed * 3.6).toFixed(1)} km/h</span>
            </div>
          )}

          {/* Timestamp */}
          {currentPosition && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(currentPosition.timestamp).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-2 text-xs text-destructive">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};