import React, { useState } from 'react';
import { Trail } from '@/services/trailService';
import { FieldPhoto } from '@/services/cameraService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MapCore, { maplibregl } from '@/components/map/MapCore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Route, MapPin, Camera, Clock, Activity, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RouteViewerProps {
  trail: Trail | null;
  isOpen: boolean;
  onClose: () => void;
  photos?: FieldPhoto[];
}

export const RouteViewer: React.FC<RouteViewerProps> = ({
  trail,
  isOpen,
  onClose,
  photos = []
}) => {
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const handleMapLoad = (mapInstance: maplibregl.Map) => {
    if (!trail?.points.length) return;
    
    setMap(mapInstance);

    // Create route line coordinates
    const coordinates = trail.points.map(point => [point.longitude, point.latitude]);

    // Add route line source
    mapInstance.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    // Add route line layer with iOS-style styling
    mapInstance.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3b82f6',
        'line-width': 4,
        'line-opacity': 0.8,
        'line-blur': 0.5 // Subtle blur for iOS-style smoothness
      }
    });

    // Add start point marker with enhanced styling
    if (coordinates.length > 0) {
      new maplibregl.Marker({ 
        color: '#22c55e',
        scale: 1.2 
      })
        .setLngLat(coordinates[0] as [number, number])
        .addTo(mapInstance);
    }

    // Add end point marker
    if (coordinates.length > 1) {
      new maplibregl.Marker({ 
        color: '#ef4444',
        scale: 1.2 
      })
        .setLngLat(coordinates[coordinates.length - 1] as [number, number])
        .addTo(mapInstance);
    }

    // Add photo markers with corrected coordinates
    photos.forEach((photo) => {
      if (photo.latitude && photo.longitude) {
        const marker = new maplibregl.Marker({
          color: '#f59e0b',
          scale: 0.8
        })
          .setLngLat([photo.longitude, photo.latitude]) // Corrected: [lng, lat]
          .addTo(mapInstance);

        // Enhanced popup with iOS-style
        const popup = new maplibregl.Popup({ 
          offset: 25,
          className: 'ios-popup'
        })
          .setHTML(`
            <div class="p-3 glass-card rounded-xl">
              <h4 class="font-semibold text-sm text-foreground">${photo.eventLabel}</h4>
              <p class="text-xs text-muted-foreground mt-1">${format(new Date(photo.timestamp), 'HH:mm:ss', { locale: ptBR })}</p>
            </div>
          `);

        marker.setPopup(popup);
      }
    });

    // Fit map to route bounds with padding
    if (coordinates.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord as [number, number]));
      
      mapInstance.fitBounds(bounds, {
        padding: 50,
        maxZoom: 17,
        duration: 1000 // iOS-style smooth animation
      });
    }
  };

  const exportRoute = () => {
    if (!trail) return;

    const kmlData = generateKML(trail, photos);
    const blob = new Blob([kmlData], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rota_${trail.farmName}_${format(new Date(trail.startTime), 'yyyy-MM-dd_HH-mm')}.kml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateKML = (trail: Trail, photos: FieldPhoto[]): string => {
    const coordinates = trail.points
      .map(point => `${point.longitude},${point.latitude},0`)
      .join(' ');

    const photoPlacemarks = photos
      .filter(photo => photo.latitude && photo.longitude)
      .map(photo => `
        <Placemark>
          <name>${photo.eventLabel}</name>
          <description>${photo.notes || ''}</description>
          <Point>
            <coordinates>${photo.longitude},${photo.latitude},0</coordinates>
          </Point>
        </Placemark>
      `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Rota ${trail.farmName}</name>
    <description>Rota gravada em ${format(new Date(trail.startTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</description>
    
    <Placemark>
      <name>Rota ${trail.farmName}</name>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${coordinates}</coordinates>
      </LineString>
    </Placemark>
    
    ${photoPlacemarks}
  </Document>
</kml>`;
  };

  if (!trail) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-crisp">
            <Route className="h-5 w-5" />
            {trail.farmName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[70vh]">
          {/* Map with iOS optimizations */}
          <div className="lg:col-span-2">
            <MapCore
              options={{
                center: [0, 0], // Will be overridden by fitBounds
                zoom: 16
              }}
              onMapLoad={handleMapLoad}
              className="w-full h-full rounded-xl border shadow-ios-lg"
            />
          </div>

          {/* Info Panel with iOS-style cards */}
          <div className="space-y-4">
            {/* Stats Card */}
            <Card className="p-4 glass-card border-0 shadow-ios-md">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-crisp">
                <Activity className="h-4 w-4" />
                Estatísticas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Distância:</span>
                  <span className="font-medium text-crisp">{trail.totalDistance ? (trail.totalDistance / 1000).toFixed(2) : '0'} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duração:</span>
                  <span className="font-medium text-crisp">
                    {trail.endTime ? 
                      (() => {
                        const duration = new Date(trail.endTime).getTime() - new Date(trail.startTime).getTime();
                        const minutes = Math.floor(duration / 60000);
                        const hours = Math.floor(minutes / 60);
                        return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
                      })() : 'Em andamento'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pontos GPS:</span>
                  <span className="font-medium text-crisp">{trail.points.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fotos:</span>
                  <span className="font-medium text-crisp">{photos.length}</span>
                </div>
              </div>
            </Card>

            {/* Time Info Card */}
            <Card className="p-4 glass-card border-0 shadow-ios-md">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-crisp">
                <Clock className="h-4 w-4" />
                Horários
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Início:</span>
                  <span className="text-crisp">{format(new Date(trail.startTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                </div>
                {trail.endTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fim:</span>
                    <span className="text-crisp">{format(new Date(trail.endTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Photos Card */}
            {photos.length > 0 && (
              <Card className="p-4 glass-card border-0 shadow-ios-md">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-crisp">
                  <Camera className="h-4 w-4" />
                  Fotos da Rota
                </h3>
                <ScrollArea className="max-h-32 smooth-scroll">
                  <div className="space-y-2">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="flex items-center gap-2 text-sm">
                        <Camera className="h-3 w-3 text-muted-foreground" />
                        <span className="flex-1 truncate text-crisp">{photo.eventLabel}</span>
                        <Badge variant="outline" className="text-xs">
                          {format(new Date(photo.timestamp), 'HH:mm')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button 
            variant="outline" 
            onClick={exportRoute}
            className="ios-button hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar KML
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="ios-button hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
