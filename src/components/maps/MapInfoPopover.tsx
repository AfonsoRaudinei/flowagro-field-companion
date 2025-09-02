import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain,
  Mountain,
  Sprout,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ExternalLink
} from 'lucide-react';
import { useMapClickData } from '@/hooks/useMapClickData';

interface MapInfoPopoverProps {
  className?: string;
  position?: { x: number; y: number };
  onClose?: () => void;
  onShowDetails?: (coordinates: [number, number]) => void;
}

export const MapInfoPopover = ({ 
  className,
  position = { x: 0, y: 0 },
  onClose,
  onShowDetails
}: MapInfoPopoverProps) => {
  const { clickData, isLoading, error } = useMapClickData();

  if (!clickData && !isLoading) return null;

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const getNDVIStatus = (ndvi: number | null) => {
    if (!ndvi) return { label: 'N/A', color: 'secondary' as const };
    
    if (ndvi >= 0.7) return { label: 'Excelente', color: 'default' as const };
    if (ndvi >= 0.5) return { label: 'Bom', color: 'secondary' as const };
    if (ndvi >= 0.3) return { label: 'Regular', color: 'outline' as const };
    return { label: 'Baixo', color: 'destructive' as const };
  };

  const getGrowthStageIcon = (stage: string | null) => {
    if (!stage) return <Sprout className="w-4 h-4" />;
    
    if (stage.includes('Germinação')) return <Sprout className="w-4 h-4" />;
    if (stage.includes('Vegetativo')) return <TrendingUp className="w-4 h-4" />;
    if (stage.includes('Floração')) return <Sprout className="w-4 h-4" />;
    return <Sprout className="w-4 h-4" />;
  };

  return (
    <Card 
      className={`absolute z-50 w-80 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Informações do Local
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">
            {error}
          </div>
        ) : clickData ? (
          <>
            {/* Coordinates */}
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Lat: {formatCoordinate(clickData.coordinates[1])}</span>
                <span>Lng: {formatCoordinate(clickData.coordinates[0])}</span>
              </div>
            </div>

            <Separator />

            {/* NDVI */}
            {clickData.ndvi && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">NDVI</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">
                    {clickData.ndvi.toFixed(3)}
                  </span>
                  <Badge variant={getNDVIStatus(clickData.ndvi).color} className="text-xs">
                    {getNDVIStatus(clickData.ndvi).label}
                  </Badge>
                </div>
              </div>
            )}

            {/* Weather */}
            {clickData.weather && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Clima Atual</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-3 h-3 text-orange-500" />
                      <span>{clickData.weather.temperature}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span>{clickData.weather.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind className="w-3 h-3 text-gray-500" />
                      <span>{clickData.weather.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CloudRain className="w-3 h-3 text-blue-600" />
                      <span>{clickData.weather.precipitation}mm</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Soil */}
            {clickData.soil && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Solo</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Umidade:</span>
                      <span className="font-mono">{clickData.soil.moisture}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>pH:</span>
                      <span className="font-mono">{clickData.soil.ph}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>M.O.:</span>
                      <span className="font-mono">{clickData.soil.organic_matter}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>N:</span>
                      <span className="font-mono">{clickData.soil.nitrogen} ppm</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Additional Info */}
            <Separator />
            <div className="flex justify-between items-center text-xs">
              {clickData.elevation && (
                <div className="flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-gray-600" />
                  <span>{clickData.elevation}m</span>
                </div>
              )}
              {clickData.growthStage && (
                <div className="flex items-center gap-1">
                  {getGrowthStageIcon(clickData.growthStage)}
                  <span className="text-muted-foreground">{clickData.growthStage}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {onShowDetails && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowDetails(clickData.coordinates)}
                  className="w-full text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  Ver Análise Detalhada
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};