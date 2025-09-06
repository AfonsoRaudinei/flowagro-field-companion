import React from "react";
import { UnifiedMap, type MapConfig } from "@/components/maps";

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
      <UnifiedMap 
        config={mapConfig}
        className="w-full h-full"
      />
    </div>
  );
}
