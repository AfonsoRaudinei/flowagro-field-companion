import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  History, 
  BarChart3,
  X,
  Thermometer,
  Droplets,
  Wind,
  Leaf,
  Target
} from 'lucide-react';
import { useMapClickData } from '@/hooks/useMapClickData';
import { cn } from '@/lib/utils';

interface EnhancedMapClickPopoverProps {
  className?: string;
  onAddPin?: (coordinates: [number, number]) => void;
  onAnalyzeArea?: (coordinates: [number, number]) => void;
  onViewHistory?: (coordinates: [number, number]) => void;
}

export const EnhancedMapClickPopover: React.FC<EnhancedMapClickPopoverProps> = ({
  className,
  onAddPin,
  onAnalyzeArea,
  onViewHistory
}) => {
  const { clickData, isLoading, error, clearData } = useMapClickData();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate popover position to avoid edges
  useEffect(() => {
    if (!clickData) return;

    const handlePositioning = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popoverWidth = 320; // Card width
      const popoverHeight = 400; // Estimated height
      const margin = 16;

      // Get mouse position (simplified - in real implementation you'd track actual click position)
      const mouseX = viewportWidth / 2;
      const mouseY = viewportHeight / 2;

      let x = mouseX + 10;
      let y = mouseY + 10;

      // Adjust if popover would go off-screen
      if (x + popoverWidth > viewportWidth - margin) {
        x = mouseX - popoverWidth - 10;
      }
      if (y + popoverHeight > viewportHeight - margin) {
        y = mouseY - popoverHeight - 10;
      }

      // Ensure minimum distance from edges
      x = Math.max(margin, Math.min(x, viewportWidth - popoverWidth - margin));
      y = Math.max(margin, Math.min(y, viewportHeight - popoverHeight - margin));

      setPosition({ x, y });
    };

    handlePositioning();
    window.addEventListener('resize', handlePositioning);
    return () => window.removeEventListener('resize', handlePositioning);
  }, [clickData]);

  if (!clickData || !position) return null;

  const getNdviColor = (ndvi: number) => {
    if (ndvi > 0.7) return 'text-green-600';
    if (ndvi > 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNdviStatus = (ndvi: number) => {
    if (ndvi > 0.7) return 'Saudável';
    if (ndvi > 0.4) return 'Moderado';
    return 'Estressado';
  };

  return (
    <Card 
      className={cn(
        "fixed w-80 z-[60] shadow-xl pointer-events-auto",
        "animate-scale-in",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Dados Contextuais
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearData}
            className="h-6 w-6"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <>
            {/* Coordinates */}
            <div className="space-y-1">
              <p className="text-xs font-medium">Coordenadas</p>
              <p className="text-xs text-mono text-muted-foreground">
                {clickData.coordinates[1].toFixed(6)}, {clickData.coordinates[0].toFixed(6)}
              </p>
            </div>

            <Separator />

            {/* NDVI Analysis */}
            {clickData.ndvi && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Índice NDVI</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Valor:</span>
                  <Badge className={cn("text-white", getNdviColor(clickData.ndvi))}>
                    {clickData.ndvi.toFixed(3)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Status:</span>
                  <Badge variant="outline">
                    {getNdviStatus(clickData.ndvi)}
                  </Badge>
                </div>
                {clickData.growthStage && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Estágio:</span>
                    <Badge variant="secondary">
                      {clickData.growthStage}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Weather Data */}
            {clickData.weather && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Condições Climáticas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-3 h-3 text-orange-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Temperatura</p>
                      <p className="text-sm font-mono">{clickData.weather.temperature}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Umidade</p>
                      <p className="text-sm font-mono">{clickData.weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="w-3 h-3 text-gray-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Vento</p>
                      <p className="text-sm font-mono">{clickData.weather.windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3 h-3 text-cyan-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Chuva</p>
                      <p className="text-sm font-mono">{clickData.weather.precipitation}mm</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Soil Data */}
            {clickData.soil && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Análise do Solo</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Umidade</p>
                    <p className="text-sm font-mono">{clickData.soil.moisture}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">pH</p>
                    <p className="text-sm font-mono">{clickData.soil.ph}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">M.O.</p>
                    <p className="text-sm font-mono">{clickData.soil.organic_matter}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nitrogênio</p>
                    <p className="text-sm font-mono">{clickData.soil.nitrogen} ppm</p>
                  </div>
                </div>
              </div>
            )}

            {/* Elevation */}
            {clickData.elevation && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs">Elevação:</span>
                  <Badge variant="outline">{clickData.elevation}m</Badge>
                </div>
              </>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddPin?.(clickData.coordinates)}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <MapPin className="w-3 h-3" />
                <span className="text-xs">Pin</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAnalyzeArea?.(clickData.coordinates)}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <BarChart3 className="w-3 h-3" />
                <span className="text-xs">Análise</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewHistory?.(clickData.coordinates)}
                className="flex flex-col gap-1 h-auto py-2"
              >
                <History className="w-3 h-3" />
                <span className="text-xs">Histórico</span>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};