import React, { useState, useRef, useEffect } from "react";
import { MapProvider, useMap } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { DrawingToolsPanel } from "@/components/maps/DrawingToolsPanel";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from "@/hooks/useMapInstance";
import { Button } from "@/components/ui/button";
import { Camera, Layers, Navigation, ZoomIn, ZoomOut, LocateFixed, PenTool, Mountain, Satellite, Route, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

// Layout simplificado e funcional
const TechnicalMapLayout = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<'terrain' | 'hybrid'>('hybrid');
  const [roadsEnabled, setRoadsEnabled] = useState(false);
  const [mapTilerToken, setMapTilerToken] = useState<string | null>(null);
  const layersMenuRef = useRef<HTMLDivElement>(null);
  const layersButtonRef = useRef<HTMLButtonElement>(null);
  
  const mapContext = useMap();
  const { flyToCurrentLocation } = useMapNavigation();
  const { toast } = useToast();
  const {
    activeTool,
    drawnShapes,
    isDrawingMode,
    setActiveTool,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    clearAllShapes,
    exportShapes
  } = useMapDrawing();

  // Get MapTiler token on mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const { data } = await supabase.functions.invoke('maptiler-token');
        if (data?.key) {
          setMapTilerToken(data.key);
        }
      } catch (error) {
        console.error('Failed to get MapTiler token:', error);
      }
    };
    getToken();
  }, []);

  // Close layers menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLayersMenu && 
          layersMenuRef.current && 
          !layersMenuRef.current.contains(event.target as Node) &&
          layersButtonRef.current &&
          !layersButtonRef.current.contains(event.target as Node)) {
        setShowLayersMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLayersMenu]);

  const setMapLayer = async (layer: 'terrain' | 'hybrid') => {
    setCurrentLayer(layer);
    setShowLayersMenu(false);
    
    // Get map instance and change style
    if (mapContext?.map) {
      let styleUrl = '';
      
      if (mapTilerToken) {
        styleUrl = layer === 'terrain' 
          ? `https://api.maptiler.com/maps/landscape/style.json?key=${mapTilerToken}`
          : `https://api.maptiler.com/maps/satellite/style.json?key=${mapTilerToken}`;
      } else {
        // Fallback for OpenStreetMap
        styleUrl = JSON.stringify({
          version: 8,
          name: layer === 'terrain' ? "OpenStreetMap Terrain" : "OpenStreetMap",
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors"
            }
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm"
            }
          ]
        });
      }
      
      mapContext.map.setStyle(styleUrl);
      console.log(`Map layer changed to: ${layer}`);
      
      // Reapply roads overlay if it was enabled
      if (roadsEnabled) {
        mapContext.map.once('styledata', () => {
          setTimeout(() => toggleRoadsOverlay(), 100);
        });
      }
    }
  };

  const toggleRoadsOverlay = () => {
    const newRoadsState = !roadsEnabled;
    setRoadsEnabled(newRoadsState);
    
    // Toggle roads overlay on map
    if (mapContext?.map) {
      if (newRoadsState) {
        // Add roads layer if it doesn't exist
        if (!mapContext.map.getLayer('roads-overlay')) {
          mapContext.map.addSource('roads-overlay', {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256
          });
          
          mapContext.map.addLayer({
            id: 'roads-overlay',
            type: 'raster',
            source: 'roads-overlay',
            paint: {
              'raster-opacity': 0.5
            }
          });
        } else {
          mapContext.map.setLayoutProperty('roads-overlay', 'visibility', 'visible');
        }
      } else {
        // Hide roads layer
        if (mapContext.map.getLayer('roads-overlay')) {
          mapContext.map.setLayoutProperty('roads-overlay', 'visibility', 'none');
        }
      }
      
      console.log(`Roads overlay ${newRoadsState ? 'enabled' : 'disabled'}`);
    }
  };
  
  const handleCameraCapture = () => {
    setCameraActive(true);
    console.log('Camera capture initiated');
    setTimeout(() => {
      setCameraActive(false);
      console.log('Photo captured successfully');
    }, 2000);
  };

  const handleLocationClick = async () => {
    try {
      await flyToCurrentLocation(16);
      toast({
        title: "Localização encontrada",
        description: "Mapa centrado na sua localização atual",
      });
    } catch (error) {
      toast({
        title: "Erro de localização",
        description: "Não foi possível obter sua localização",
        variant: "destructive",
      });
    }
  };

  // LayersMenu component
  const LayersMenu = () => (
    <div 
      ref={layersMenuRef}
      className="absolute top-12 left-0 bg-card/95 backdrop-blur-sm border border-border/20 rounded-xl shadow-lg py-2 min-w-[140px] z-30"
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      {/* Terrain Layer */}
      <button
        onClick={() => setMapLayer('terrain')}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98",
          currentLayer === 'terrain' ? "text-[rgb(0,87,255)]" : "text-foreground"
        )}
      >
        <div className="relative">
          <Mountain className="h-4 w-4" />
          {currentLayer === 'terrain' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[rgb(0,87,255)] rounded-full" />
          )}
        </div>
        <span>Terreno</span>
      </button>

      {/* Hybrid/Satellite Layer */}
      <button
        onClick={() => setMapLayer('hybrid')}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98",
          currentLayer === 'hybrid' ? "text-[rgb(0,87,255)]" : "text-foreground"
        )}
      >
        <div className="relative">
          <Satellite className="h-4 w-4" />
          {currentLayer === 'hybrid' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[rgb(0,87,255)] rounded-full" />
          )}
        </div>
        <span>Híbrido</span>
      </button>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-2 my-1" />

      {/* Roads Toggle */}
      <button
        onClick={toggleRoadsOverlay}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98",
          roadsEnabled ? "text-[rgb(0,87,255)]" : "text-foreground"
        )}
      >
        <div className="relative">
          <Route className="h-4 w-4" />
          {roadsEnabled && (
            <Check className="absolute -top-1 -right-1 w-3 h-3 text-[rgb(0,87,255)]" />
          )}
        </div>
        <span>Estradas</span>
      </button>
    </div>
  );
  return <div className="min-h-screen bg-background relative">
      {/* Mapa Principal - SIMPLIFICADO */}
      <SimpleBaseMap className="w-full h-screen" />

      {/* Controles Simplificados - Top */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <div className="relative">
          <Button 
            ref={layersButtonRef}
            variant={showLayersMenu ? "default" : "secondary"} 
            size="sm" 
            onClick={() => setShowLayersMenu(!showLayersMenu)} 
            className={cn(
              "bg-background/90 backdrop-blur-sm transition-all duration-200",
              showLayersMenu && "bg-[rgb(0,87,255)]/10 text-[rgb(0,87,255)] border-[rgb(0,87,255)]/20"
            )}
          >
            <Layers className="h-4 w-4" />
          </Button>
          
          {/* Layers Menu */}
          {showLayersMenu && <LayersMenu />}
        </div>
        
        <Button variant={showDrawingPanel ? "default" : "secondary"} size="sm" onClick={() => setShowDrawingPanel(!showDrawingPanel)} className="bg-background/90 backdrop-blur-sm">
          <PenTool className="h-4 w-4" />
        </Button>
      </div>

      {/* Controles de Zoom - Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button variant="secondary" size="sm" onClick={() => console.log('Zoom in')} className="bg-background/90 backdrop-blur-sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => console.log('Zoom out')} className="bg-background/90 backdrop-blur-sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={handleLocationClick} className="bg-background/90 backdrop-blur-sm">
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Actions - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Button onClick={handleCameraCapture} size="lg" className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90">
          <Camera className="h-6 w-6" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => console.log('Navigation')} className="bg-background/90 backdrop-blur-sm">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Drawing Tools Panel */}
      {showDrawingPanel && <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <DrawingToolsPanel activeTool={activeTool} onToolSelect={setActiveTool} onStartDrawing={startDrawing} onFinishDrawing={finishDrawing} onCancelDrawing={cancelDrawing} onClearAll={clearAllShapes} onExport={exportShapes} isDrawingMode={isDrawingMode} shapesCount={drawnShapes.length} />
        </div>}

      {/* Loading overlay para camera */}
      {cameraActive && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-medium">Capturando foto...</span>
            </div>
          </div>
        </div>}
    </div>;
};
const TechnicalMap = () => {
  return <MapProvider>
      <FullscreenTransitions>
        <TechnicalMapLayout />
      </FullscreenTransitions>
    </MapProvider>;
};
export default TechnicalMap;