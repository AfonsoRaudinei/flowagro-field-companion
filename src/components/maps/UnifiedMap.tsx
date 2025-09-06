import React, { useState, useEffect } from 'react';
import { SimpleBaseMap } from './SimpleBaseMap';
import { MapProvider, useMap } from './MapProvider';
import { LoginOverlay } from './overlays/LoginOverlay';
import { TechnicalOverlay } from './overlays/TechnicalOverlay';
import { LocationDialog } from './overlays/LocationDialog';
import { useUserLocation } from '@/hooks/useUserLocation';
import { logger } from '@/lib/logger';

export interface MapConfig {
  showLoginButton?: boolean;
  showLocationDialog?: boolean;
  showDrawingTools?: boolean;
  showStyleControls?: boolean;
  showLocationTracker?: boolean;
  showNativeControls?: boolean;
  defaultStyle?: 'satellite' | 'terrain' | 'streets';
  initialZoom?: number;
  overlayOpacity?: number;
  enableLocationPermission?: boolean;
}

interface UnifiedMapProps {
  config: MapConfig;
  className?: string;
  onLocationUpdate?: (location: [number, number]) => void;
}

const UnifiedMapContent: React.FC<UnifiedMapProps> = ({
  config,
  className = "w-full h-full",
  onLocationUpdate
}) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [mapStyle, setMapStyle] = useState(config.defaultStyle || 'satellite');

  // Initialize location dialog on mount if enabled
  useEffect(() => {
    if (config.enableLocationPermission && config.showLocationDialog) {
      const hasRequested = localStorage.getItem('flowagro-location-permission-requested');
      if (!hasRequested) {
        setShowLocationDialog(true);
      }
    }
  }, [config.enableLocationPermission, config.showLocationDialog]);

  const handleLocationUpdate = (location: [number, number]) => {
    setUserLocation(location);
    onLocationUpdate?.(location);
    logger.info('UnifiedMap: Location updated', { location });
  };

  const handleStyleChange = (style: 'satellite' | 'terrain' | 'streets') => {
    setMapStyle(style);
    logger.info('UnifiedMap: Map style changed', { style });
  };

  // Calculate map center and zoom
  const mapCenter = userLocation || [-47.8825, -15.7942]; // User location or Brasília
  const mapZoom = userLocation ? (config.initialZoom || 15) : 5;

  return (
    <div className={`relative ${className}`}>
      {/* Base Map */}
      <SimpleBaseMap
        className="w-full h-full"
        center={mapCenter}
        zoom={mapZoom}
        showNativeControls={config.showNativeControls}
        showUserMarker={!!userLocation}
      />

      {/* Overlays based on configuration */}
      {config.showLoginButton && (
        <LoginOverlay opacity={config.overlayOpacity} />
      )}

      {config.showDrawingTools && config.showStyleControls && (
        <TechnicalOverlay
          onStyleChange={handleStyleChange}
          onLocationUpdate={handleLocationUpdate}
        />
      )}

      {/* Location Dialog */}
      {config.showLocationDialog && (
        <LocationDialog
          show={showLocationDialog}
          onLocationGranted={handleLocationUpdate}
          onClose={() => setShowLocationDialog(false)}
        />
      )}
    </div>
  );
};

export const UnifiedMap: React.FC<UnifiedMapProps> = (props) => {
  return (
    <MapProvider>
      <UnifiedMapContent {...props} />
    </MapProvider>
  );
};