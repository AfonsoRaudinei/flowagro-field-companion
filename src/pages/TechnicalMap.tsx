import React from "react";
import { MapProvider } from "@/components/maps/MapProvider";
import { UnifiedMapContent, type MapConfig } from "@/components/maps";
import { TechnicalMapHeader } from "@/components/maps/TechnicalMapHeader";
import { FloatingCameraButton } from "@/components/maps/FloatingCameraButton";
import { FloatingCloseButton } from "@/components/maps/FloatingCloseButton";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "relative w-full overflow-hidden bg-background",
      // Responsive viewport height
      "h-screen min-h-screen",
      // iOS Safari viewport fix
      "min-h-[100dvh] h-[100dvh] sm:h-screen sm:min-h-screen"
    )}>
      {/* Custom Header */}
      <TechnicalMapHeader />
      
      {/* Map with Provider Context */}
      <MapProvider>
        {/* Map Container with responsive top padding */}
        <div className={cn(
          "h-full w-full",
          // Responsive top padding to account for header
          "pt-12 sm:pt-14"
        )}>
          <UnifiedMapContent 
            config={mapConfig}
            className="w-full h-full"
          />
        </div>

        {/* Floating Action Buttons - Inside MapProvider */}
        <FloatingCameraButton />
        <FloatingCloseButton />
      </MapProvider>
    </div>
  );
}
