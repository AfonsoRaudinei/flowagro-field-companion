import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, X } from 'lucide-react';
import { useMapClickData } from '@/hooks/useMapClickData';

interface MapInfoPopoverProps {
  className?: string;
  position?: { x: number; y: number };
  onClose?: () => void;
}

export const MapInfoPopover = ({ 
  className,
  position = { x: 0, y: 0 },
  onClose
}: MapInfoPopoverProps) => {
  const { clickData, isLoading, error } = useMapClickData();

  if (!clickData && !isLoading) return null;

  return (
    <Card 
      className={`absolute z-50 w-80 shadow-xl ${className || ''}`}
      style={{
        left: position.x,
        top: position.y,
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
          <div className="text-sm">Carregando dados...</div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : clickData ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Lat: {clickData.coordinates[1].toFixed(6)}</span>
                <span>Lng: {clickData.coordinates[0].toFixed(6)}</span>
              </div>
            </div>
            {clickData.ndvi && (
              <div className="flex justify-between">
                <span className="text-sm">NDVI:</span>
                <span className="text-sm font-mono">{clickData.ndvi.toFixed(3)}</span>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};