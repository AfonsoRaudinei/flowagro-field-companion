import React from "react";
import { MapProvider } from "@/components/maps/MapProvider";
import { UnifiedMapContent, type MapConfig } from "@/components/maps";
import { TechnicalMapHeader } from "@/components/maps/TechnicalMapHeader";
import { FloatingCameraButton } from "@/components/maps/FloatingCameraButton";
import { FloatingCloseButton } from "@/components/maps/FloatingCloseButton";

export default function TechnicalMap() {
  // Configuration for technical map
  const mapConfig: MapConfig = {
    showDrawingTools: true,
    showStyleControls: true,
    showLocationTracker: true,
    showNativeControls: false,
    defaultStyle: 'satellite',
    initialZoom: 15
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Custom Header */}
      <TechnicalMapHeader />
      
      {/* Map with Provider Context */}
      <MapProvider>
        <div className="pt-14 h-full">
          <UnifiedMapContent 
            config={mapConfig}
            className="w-full h-full"
          />
        </div>

        {/* Floating Action Buttons - Inside MapProvider */}
        <FloatingCameraButton className="bottom-6 right-6" />
        <FloatingCloseButton />
      </MapProvider>
    </div>
  );
}
