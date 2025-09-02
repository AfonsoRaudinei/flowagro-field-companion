import React, { useState, useRef, useEffect } from "react";
import { MapProvider, useMap } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { DrawingToolsPanel } from "@/components/maps/DrawingToolsPanel";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from '@/hooks/useMapInstance';
import { useZoomControl } from '@/hooks/useZoomControl';
import { useToast } from "@/hooks/use-toast";
import { getStyleUrl, MAP_STYLES, type MapStyle } from '@/services/mapService';
import { Button } from "@/components/ui/button";
import { Camera, Layers, Navigation, ZoomIn, ZoomOut, LocateFixed, PenTool, Mountain, Satellite, Route, Check, ImageIcon, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

// Layout simplificado e funcional
const TechnicalMapLayout = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<MapStyle>('hybrid');
  const [roadsEnabled, setRoadsEnabled] = useState(false);
  const [mapTilerToken, setMapTilerToken] = useState<string | null>(null);
  const [isLayerChanging, setIsLayerChanging] = useState(false);
  const layersMenuRef = useRef<HTMLDivElement>(null);
  const layersButtonRef = useRef<HTMLButtonElement>(null);
  const cameraMenuRef = useRef<HTMLDivElement>(null);
  const cameraButtonRef = useRef<HTMLButtonElement>(null);
  
  const mapContext = useMap();
  const { flyToCurrentLocation } = useMapNavigation();
  const { zoomIn, zoomOut, currentZoom, isZooming } = useZoomControl();
  const { toast } = useToast();
  const {
    activeTool,
    drawnShapes,
    isDrawingMode,
    currentShape,
    setActiveTool,
    startDrawing,
    finishDrawing,
    cancelDrawing,
    clearAllShapes,
    exportShapes,
    deleteShape,
    analyzeShape,
    saveShape
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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLayersMenu && 
          layersMenuRef.current && 
          !layersMenuRef.current.contains(event.target as Node) &&
          layersButtonRef.current &&
          !layersButtonRef.current.contains(event.target as Node)) {
        setShowLayersMenu(false);
      }
      
      if (showCameraMenu && 
          cameraMenuRef.current && 
          !cameraMenuRef.current.contains(event.target as Node) &&
          cameraButtonRef.current &&
          !cameraButtonRef.current.contains(event.target as Node)) {
        setShowCameraMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLayersMenu, showCameraMenu]);

  const setMapLayer = async (layer: MapStyle) => {
    if (isLayerChanging) return;
    
    setCurrentLayer(layer);
    setShowLayersMenu(false);
    setIsLayerChanging(true);
    
    // Get map instance and change style
    if (mapContext?.map) {
      try {
        const styleUrl = getStyleUrl(layer, mapTilerToken || undefined);
        mapContext.map.setStyle(styleUrl);
        
        console.log(`Map layer changed to: ${layer}`);
        
        // Reapply roads overlay if it was enabled
        if (roadsEnabled) {
          mapContext.map.once('styledata', () => {
            setTimeout(() => {
              toggleRoadsOverlay();
              setIsLayerChanging(false);
            }, 100);
          });
        } else {
          mapContext.map.once('styledata', () => {
            setIsLayerChanging(false);
          });
        }
        
        toast({
          title: "Camada alterada",
          description: `Visualização alterada para ${
            layer === 'terrain' ? 'Terreno' : 
            layer === 'satellite' ? 'Satélite' : 
            layer === 'hybrid' ? 'Híbrido' : 'Ruas'
          }`,
        });
      } catch (error) {
        console.error('Error changing layer:', error);
        setIsLayerChanging(false);
        toast({
          title: "Erro",
          description: "Não foi possível alterar a camada do mapa",
          variant: "destructive",
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
        // Add enhanced roads layer
        if (!mapContext.map.getLayer('roads-overlay')) {
          const roadsSource = mapTilerToken ? {
            type: 'raster' as const,
            tiles: [`https://api.maptiler.com/tiles/osm/{z}/{x}/{y}.png?key=${mapTilerToken}`],
            tileSize: 256,
            attribution: '© MapTiler © OpenStreetMap contributors'
          } : {
            type: 'raster' as const,
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          };

          mapContext.map.addSource('roads-overlay', roadsSource);
          
          mapContext.map.addLayer({
            id: 'roads-overlay',
            type: 'raster',
            source: 'roads-overlay',
            paint: {
              'raster-opacity': 0.7,
              'raster-fade-duration': 300
            }
          });
        } else {
          mapContext.map.setLayoutProperty('roads-overlay', 'visibility', 'visible');
          mapContext.map.setPaintProperty('roads-overlay', 'raster-opacity', 0.7);
        }
        
        toast({
          title: "Estradas ativadas",
          description: "Overlay de estradas foi adicionado ao mapa",
        });
      } else {
        // Hide roads layer with animation
        if (mapContext.map.getLayer('roads-overlay')) {
          mapContext.map.setPaintProperty('roads-overlay', 'raster-opacity', 0);
          setTimeout(() => {
            if (mapContext.map?.getLayer('roads-overlay')) {
              mapContext.map.setLayoutProperty('roads-overlay', 'visibility', 'none');
            }
          }, 300);
        }
        
        toast({
          title: "Estradas desativadas",
          description: "Overlay de estradas foi removido do mapa",
        });
      }
      
      console.log(`Roads overlay ${newRoadsState ? 'enabled' : 'disabled'}`);
    }
  };
  
  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
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
      const coordinates = await flyToCurrentLocation(16);
      const [lng, lat] = coordinates;
      
      toast({
        title: "Localização encontrada",
        description: `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível obter sua localização";
      
      toast({
        title: "Erro de localização", 
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleOpenCamera = async () => {
    setShowCameraMenu(false);
    try {
      // Request camera permission and open native camera
      // This will be handled by Capacitor Camera plugin
      console.log('Opening native camera...');
      
      toast({
        title: "Câmera",
        description: "Abrindo câmera para captura...",
      });
    } catch (error) {
      toast({
        title: "Erro na câmera",
        description: "Não foi possível abrir a câmera. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleOpenLibrary = async () => {
    setShowCameraMenu(false);
    try {
      // Request media permission and open photo library
      // This will be handled by Capacitor Camera plugin
      console.log('Opening photo library...');
      
      toast({
        title: "Galeria",
        description: "Abrindo galeria para seleção...",
      });
    } catch (error) {
      toast({
        title: "Erro na galeria",
        description: "Não foi possível acessar a galeria. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // LayersMenu component with enhanced options
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
        disabled={isLayerChanging}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98 disabled:opacity-50",
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

      {/* Satellite Layer */}
      <button
        onClick={() => setMapLayer('satellite')}
        disabled={isLayerChanging}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98 disabled:opacity-50",
          currentLayer === 'satellite' ? "text-[rgb(0,87,255)]" : "text-foreground"
        )}
      >
        <div className="relative">
          <Satellite className="h-4 w-4" />
          {currentLayer === 'satellite' && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[rgb(0,87,255)] rounded-full" />
          )}
        </div>
        <span>Satélite</span>
      </button>

      {/* Hybrid Layer */}
      <button
        onClick={() => setMapLayer('hybrid')}
        disabled={isLayerChanging}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98 disabled:opacity-50",
          currentLayer === 'hybrid' ? "text-[rgb(0,87,255)]" : "text-foreground"
        )}
      >
        <div className="relative">
          <Layers className="h-4 w-4" />
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
        disabled={isLayerChanging}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-200",
          "hover:bg-[rgba(0,87,255,0.1)] active:scale-98 disabled:opacity-50",
          roadsEnabled ? "text-[rgb(0,87,255)]" : "text-foreground"
        )}
      >
        <div className="relative">
          <Route className="h-4 w-4" />
          {roadsEnabled && (
            <Check className="absolute -top-1 -right-1 w-3 h-3 text-[rgb(0,87,255)]" />
          )}
        </div>
        <span>Estradas {roadsEnabled && '✓'}</span>
      </button>

      {/* Loading indicator */}
      {isLayerChanging && (
        <>
          <div className="h-px bg-border/30 mx-2 my-1" />
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
            Alterando camada...
          </div>
        </>
      )}
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

      {/* Enhanced Zoom Controls - Right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleZoomIn}
          disabled={isZooming}
          className="bg-background/90 backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        {/* Zoom Level Indicator */}
        <div className="bg-background/90 backdrop-blur-sm border border-border/20 rounded-md px-2 py-1 min-w-[2.5rem] text-center">
          <span className="text-xs font-medium">{Math.round(currentZoom)}</span>
        </div>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleZoomOut}
          disabled={isZooming}
          className="bg-background/90 backdrop-blur-sm transition-all duration-200 hover:scale-105 disabled:opacity-50"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleLocationClick} 
          className="bg-background/90 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        >
          <LocateFixed className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Actions - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <div className="relative">
          <Button 
            ref={cameraButtonRef}
            onClick={() => setShowCameraMenu(!showCameraMenu)} 
            size="lg" 
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90"
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          {/* Camera Menu */}
          {showCameraMenu && (
            <div 
              ref={cameraMenuRef}
              className="absolute bottom-full right-0 mb-2 bg-card/95 backdrop-blur-sm border border-border/20 rounded-xl shadow-lg py-2 min-w-[180px] z-50"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <button
                onClick={handleOpenCamera}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-[rgba(0,87,255,0.1)] active:scale-98 text-foreground"
              >
                <Camera className="h-4 w-4" />
                <span>Abrir Câmera</span>
              </button>
              
              <button
                onClick={handleOpenLibrary}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-[rgba(0,87,255,0.1)] active:scale-98 text-foreground"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Escolher da Biblioteca</span>
              </button>
            </div>
          )}
        </div>
        
        <Button variant="secondary" size="sm" onClick={() => console.log('Navigation')} className="bg-background/90 backdrop-blur-sm">
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

        {/* Drawing Tools Panel */}
        {showDrawingPanel && <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <DrawingToolsPanel 
            activeTool={activeTool} 
            onToolSelect={setActiveTool} 
            onStartDrawing={startDrawing} 
            onFinishDrawing={finishDrawing} 
            onCancelDrawing={cancelDrawing} 
            onClearAll={clearAllShapes} 
            onExport={exportShapes} 
            isDrawingMode={isDrawingMode} 
            shapesCount={drawnShapes.length}
            currentShape={currentShape}
            onSaveShape={saveShape}
            onDeleteShape={deleteShape}
            onAnalyzeShape={analyzeShape}
            drawnShapes={drawnShapes}
          />
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