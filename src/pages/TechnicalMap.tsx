import React from "react";
import { UnifiedMap, type MapConfig } from "@/components/maps";
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
      
      {/* Full-screen Map */}
      <div className="pt-14 h-full">
        <UnifiedMap 
          config={mapConfig}
          className="w-full h-full"
        />
      </div>

      {/* Floating Action Buttons */}
      <FloatingCameraButton className="bottom-6 right-6" />
      <FloatingCloseButton />
    </div>
  );
}
