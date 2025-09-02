import React, { useEffect, useRef } from 'react';
import { useMapInstance } from '@/hooks/useMapInstance';
import { useUserLocation } from '@/hooks/useUserLocation';
import { PremiumButton } from '@/components/ui/premium-button';
import { cn } from '@/lib/utils';
import { 
  MapPin, 
  Navigation, 
  Play, 
  Pause, 
  RotateCw,
  Crosshair,
  Zap
} from 'lucide-react';

interface UserLocationTrackerProps {
  className?: string;
  showAccuracyCircle?: boolean;
  showTrail?: boolean;
  showSpeed?: boolean;
  showFollowButton?: boolean;
  maxTrailPoints?: number;
}

export const UserLocationTracker: React.FC<UserLocationTrackerProps> = ({
  className,
  showAccuracyCircle = true,
  showTrail = true,
  showSpeed = false,
  showFollowButton = true,
  maxTrailPoints = 10
}) => {
  const { map, isReady } = useMapInstance();
  const {
    currentPosition,
    accuracy,
    speed,
    heading,
    trail,
    isTracking,
    isFollowing,
    batteryOptimized,
    error,
    startTracking,
    stopTracking,
    toggleFollowMode,
    centerOnLocation,
    setBatteryOptimized
  } = useUserLocation(maxTrailPoints);

  const locationSourceId = 'user-location';
  const trailSourceId = 'location-trail';
  const accuracySourceId = 'location-accuracy';

  useEffect(() => {
    if (!isReady || !map) return;

    // Add location dot layer
    if (!map.getSource(locationSourceId)) {
      map.addSource(locationSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'user-location-dot',
        type: 'circle',
        source: locationSourceId,
        paint: {
          'circle-radius': 8,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Pulsing animation for location dot
      map.addLayer({
        id: 'user-location-pulse',
        type: 'circle',
        source: locationSourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0,
            22, 20
          ],
          'circle-color': '#3b82f6',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'pulse'],
            0, 0.6,
            1, 0
          ]
        }
      });
    }

    // Add accuracy circle layer
    if (showAccuracyCircle && !map.getSource(accuracySourceId)) {
      map.addSource(accuracySourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'location-accuracy',
        type: 'fill',
        source: accuracySourceId,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.1
        }
      });
    }

    // Add trail layer
    if (showTrail && !map.getSource(trailSourceId)) {
      map.addSource(trailSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'location-trail',
        type: 'line',
        source: trailSourceId,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.7
        }
      });
    }

    return () => {
      // Cleanup layers
      ['user-location-dot', 'user-location-pulse', 'location-accuracy', 'location-trail'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      [locationSourceId, accuracySourceId, trailSourceId].forEach(sourceId => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
    };
  }, [isReady, map, showAccuracyCircle, showTrail]);

  // Update location data on map
  useEffect(() => {
    if (!isReady || !map || !currentPosition) return;

    const source = map.getSource(locationSourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { 
            pulse: Date.now() % 2000 / 2000 // Pulsing animation
          },
          geometry: {
            type: 'Point',
            coordinates: [currentPosition.longitude, currentPosition.latitude]
          }
        }]
      });
    }

    // Update accuracy circle
    if (showAccuracyCircle && accuracy) {
      const accuracySource = map.getSource(accuracySourceId) as mapboxgl.GeoJSONSource;
      if (accuracySource) {
        // Create circle polygon for accuracy
        const center = [currentPosition.longitude, currentPosition.latitude];
        const radiusInKm = accuracy / 1000;
        const points = 64;
        const coordinates = [];
        
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dx = radiusInKm * Math.cos(angle);
          const dy = radiusInKm * Math.sin(angle);
          coordinates.push([
            center[0] + dx / (111.32 * Math.cos(center[1] * Math.PI / 180)),
            center[1] + dy / 110.54
          ]);
        }
        coordinates.push(coordinates[0]); // Close polygon

        accuracySource.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates]
            }
          }]
        });
      }
    }

    // Update trail
    if (showTrail && trail.length > 1) {
      const trailSource = map.getSource(trailSourceId) as mapboxgl.GeoJSONSource;
      if (trailSource) {
        trailSource.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: trail.map(pos => [pos.longitude, pos.latitude])
            }
          }]
        });
      }
    }
  }, [currentPosition, accuracy, trail, isReady, map, showAccuracyCircle, showTrail]);

  if (!isReady) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-30",
        "flex flex-col gap-2",
        "transition-all duration-300",
        className
      )}
    >
      {/* Location Status Card */}
      {currentPosition && (
        <div className={cn(
          "bg-background/90 backdrop-blur-sm border border-border/50",
          "rounded-lg px-3 py-2 shadow-lg",
          "text-xs space-y-1 min-w-[140px]"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Localização</span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
          </div>
          
          {accuracy && (
            <div className="text-muted-foreground">
              Precisão: ±{Math.round(accuracy)}m
            </div>
          )}
          
          {showSpeed && speed !== null && (
            <div className="text-muted-foreground">
              Velocidade: {Math.round(speed * 3.6)} km/h
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className={cn(
        "bg-background/90 backdrop-blur-sm border border-border/50",
        "rounded-lg p-1 shadow-lg",
        "flex flex-col gap-1"
      )}>
        {/* Start/Stop Tracking */}
        <PremiumButton
          variant={isTracking ? "premium" : "outline"}
          size="icon"
          animation="press"
          onClick={isTracking ? stopTracking : startTracking}
          ariaLabel={isTracking ? "Parar rastreamento" : "Iniciar rastreamento"}
          className="h-8 w-8"
        >
          {isTracking ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </PremiumButton>

        {/* Follow Mode Toggle */}
        {showFollowButton && (
          <PremiumButton
            variant={isFollowing ? "premium" : "ghost"}
            size="icon"
            animation="hover"
            onClick={toggleFollowMode}
            disabled={!currentPosition}
            ariaLabel={isFollowing ? "Desativar seguir localização" : "Seguir localização"}
            className="h-8 w-8"
          >
            <Navigation className="h-3 w-3" />
          </PremiumButton>
        )}

        {/* Center on Location */}
        <PremiumButton
          variant="ghost"
          size="icon"
          animation="bounce"
          onClick={centerOnLocation}
          disabled={!currentPosition}
          ariaLabel="Centralizar na localização atual"
          className="h-8 w-8"
        >
          <Crosshair className="h-3 w-3" />
        </PremiumButton>

        {/* Battery Optimization Toggle */}
        <PremiumButton
          variant={batteryOptimized ? "premium" : "ghost"}
          size="icon"
          animation="glow"
          onClick={() => setBatteryOptimized(!batteryOptimized)}
          ariaLabel={batteryOptimized ? "Desativar modo economia" : "Ativar modo economia"}
          className="h-8 w-8"
        >
          <Zap className="h-3 w-3" />
        </PremiumButton>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg px-3 py-2">
          <div className="text-xs text-destructive">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};