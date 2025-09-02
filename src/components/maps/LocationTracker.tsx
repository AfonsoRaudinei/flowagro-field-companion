import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Satellite,
  Clock,
  Target,
  Zap,
  Play,
  Square
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationTrackerProps {
  className?: string;
  showCompactView?: boolean;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  className,
  showCompactView = false
}) => {
  const {
    currentPosition,
    accuracy,
    speed,
    heading,
    isTracking,
    isFollowing,
    error,
    startTracking,
    stopTracking,
    toggleFollowMode,
    centerOnLocation,
    getCurrentLocation
  } = useUserLocation();
  
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Update timestamp when position changes
  useEffect(() => {
    if (currentPosition) {
      setLastUpdate(new Date());
    }
  }, [currentPosition]);

  const handleCenterOnLocation = async () => {
    if (!currentPosition) {
      // Get current location if not available
      const location = await getCurrentLocation();
      if (location) {
        toast({
          title: "Localização encontrada",
          description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
        });
      }
    } else {
      await centerOnLocation();
      toast({
        title: "Centralizado no GPS",
        description: `Precisão: ±${accuracy?.toFixed(0)}m`,
      });
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      await stopTracking();
      toast({
        title: "Rastreamento parado",
        description: "GPS desativado",
      });
    } else {
      await startTracking();
      toast({
        title: "Rastreamento iniciado", 
        description: "GPS ativo em tempo real",
      });
    }
  };

  if (showCompactView) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          onClick={handleCenterOnLocation}
          variant="secondary"
          size="sm"
          className={cn(
            "w-12 h-12 rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-200",
            "bg-card/95 hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
            currentPosition && "ring-2 ring-green-500/30"
          )}
          disabled={!currentPosition && isTracking}
        >
          <Target className={cn(
            "h-4 w-4",
            currentPosition ? "text-green-600" : "text-muted-foreground"
          )} />
        </Button>
        
        {currentPosition && (
          <div className="bg-card/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border-0">
            <div className="text-xs font-mono text-center text-foreground">
              {currentPosition.latitude.toFixed(4)}, {currentPosition.longitude.toFixed(4)}
            </div>
            {accuracy && (
              <div className="text-xs text-muted-foreground text-center">
                ±{accuracy.toFixed(0)}m
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span className="font-medium">Localização GPS</span>
        </div>
        <Badge variant={isTracking ? "default" : "secondary"}>
          {isTracking ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleToggleTracking}
          variant={isTracking ? "destructive" : "default"}
          size="sm"
          className="rounded-xl"
        >
          {isTracking ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Parar
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </>
          )}
        </Button>

        <Button
          onClick={handleCenterOnLocation}
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!currentPosition}
        >
          <Target className="w-4 h-4 mr-2" />
          Centralizar
        </Button>

        <Button
          onClick={toggleFollowMode}
          variant={isFollowing ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          disabled={!isTracking}
        >
          <Navigation className="w-4 h-4 mr-2" />
          {isFollowing ? "Seguindo" : "Seguir"}
        </Button>

        <Button
          onClick={getCurrentLocation}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          <Satellite className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {currentPosition && (
        <div className="bg-muted/50 p-4 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Latitude:</span>
              <div className="font-mono">{currentPosition.latitude.toFixed(8)}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Longitude:</span>
              <div className="font-mono">{currentPosition.longitude.toFixed(8)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            {accuracy && (
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Precisão</div>
                <div className="font-mono">±{accuracy.toFixed(0)}m</div>
              </div>
            )}
            
            {speed && speed > 0 && (
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Velocidade</div>
                <div className="font-mono">{(speed * 3.6).toFixed(1)} km/h</div>
              </div>
            )}
            
            {heading !== null && heading !== undefined && (
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Direção</div>
                <div className="font-mono">{heading.toFixed(0)}°</div>
              </div>
            )}
          </div>

          {lastUpdate && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Atualizado: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-primary">
          <Zap className="w-3 h-3" />
          <span className="font-medium">
            GPS integrado com geometrias - coordenadas salvas automaticamente
          </span>
        </div>
      </div>
    </Card>
  );
};