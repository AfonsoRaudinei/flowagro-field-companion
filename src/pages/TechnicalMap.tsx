import React, { useState } from "react";
import { MapProvider } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { Button } from "@/components/ui/button";
import { Camera, Layers, Navigation, ZoomIn, ZoomOut, LocateFixed } from "lucide-react";

// Layout simplificado e funcional
const TechnicalMapLayout = () => {
  const [cameraActive, setCameraActive] = useState(false);

  const handleCameraCapture = () => {
    setCameraActive(true);
    console.log('Camera capture initiated');
    setTimeout(() => {
      setCameraActive(false);
      console.log('Photo captured successfully');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mapa Principal - SIMPLIFICADO */}
      <SimpleBaseMap className="w-full h-screen" />

      {/* Controles Simplificados - Top */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.history.back()}
          className="bg-background/90 backdrop-blur-sm"
        >
          ← Voltar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log('Layers clicked')}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Controles de Zoom - Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log('Zoom in')}
          className="bg-background/90 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log('Zoom out')}
          className="bg-background/90 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => console.log('Location')}
          className="bg-background/90 backdrop-blur-sm"
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Actions - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Button
          onClick={handleCameraCapture}
          size="lg"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
        >
          <Camera className="h-6 w-6" />
        </Button>
        <Button
          variant="secondary" 
          size="sm"
          onClick={() => console.log('Navigation')}
          className="bg-background/90 backdrop-blur-sm"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

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