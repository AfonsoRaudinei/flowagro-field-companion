import React, { useState } from "react";
import { MapProvider } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { useIsMobile } from '@/hooks/use-mobile';
import { IntegratedMapInterface } from "@/components/maps/IntegratedMapInterface";
import { MapFloatingActions } from "@/components/maps/MapFloatingActions";
import { QuickActionsBar } from "@/components/maps/QuickActionsBar";
import { MicroFABs } from "@/components/maps/MicroFABs";
import { useMapPins } from '@/hooks/useMapPins';
import { useNDVILayer } from '@/hooks/useNDVILayer';
import { useZoomControl } from '@/hooks/useZoomControl';
import { useUserLocation } from '@/hooks/useUserLocation';

// Layout unificado com Floating Actions
const TechnicalMapLayout = () => {
  const { pins } = useMapPins();
  const { config: ndviConfig } = useNDVILayer();
  const { currentZoom, zoomIn, zoomOut } = useZoomControl();
  const { isTracking, startTracking, stopTracking } = useUserLocation();
  const [cameraActive, setCameraActive] = useState(false);

  const handleCameraCapture = () => {
    setCameraActive(true);
    console.log('Camera capture initiated');
    // Simular captura
    setTimeout(() => {
      setCameraActive(false);
      console.log('Photo captured successfully');
    }, 2000);
  };

  const handleMapStyleChange = (style: string) => {
    console.log('Map style changed to:', style);
  };

  const handleMeasurementStart = () => {
    console.log('Measurement tool activated');
  };

  const handleLocationToggle = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mapa Principal */}
      <IntegratedMapInterface
        className="w-full h-screen"
        farmId="demo-farm-001"
        farmName="Fazenda Técnica Demo"
        onPhotoCapture={(photoData, location) => {
          console.log('Photo captured:', {
            dataLength: photoData.length,
            location: location ? `${location.latitude}, ${location.longitude}` : 'No location'
          });
        }}
        onMapStyleChange={handleMapStyleChange}
      />

      {/* Quick Actions Bar (Top-left) */}
      <QuickActionsBar
        onCameraClick={handleCameraCapture}
        onLayersClick={() => console.log('Layers clicked')}
        onSettingsClick={() => console.log('Settings clicked')}
        activePins={pins.length}
        ndviActive={ndviConfig.visible}
      />

      {/* Micro FABs (Top-right) */}
      <MicroFABs
        currentZoom={currentZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        locationActive={isTracking}
        onLocationToggle={handleLocationToggle}
        showCompass={true}
        compassHeading={0}
        onCompassClick={() => console.log('Compass clicked')}
        showWeather={false} // Contextual - aparece quando dados disponíveis
      />

      {/* Main Floating Actions (Bottom-right) */}
      <MapFloatingActions
        onCameraCapture={handleCameraCapture}
        onMapStyleChange={handleMapStyleChange}
        onMeasurementStart={handleMeasurementStart}
      />

      {/* Loading overlay para camera */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Capturando foto...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TechnicalMap = () => {
  return (
    <MapProvider>
      <FullscreenTransitions>
        <TechnicalMapLayout />
      </FullscreenTransitions>
    </MapProvider>
  );
};

export default TechnicalMap;