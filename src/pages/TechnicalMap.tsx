import React, { useState, useRef, useEffect } from "react";
import { MapProvider, useMap } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { DrawingToolsPanel } from "@/components/maps/DrawingToolsPanel";
import { MapFloatingActions } from "@/components/maps/MapFloatingActions";
import { NavigationControlsHub } from "@/components/maps/NavigationControlsHub";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from '@/hooks/useMapInstance';
import { useZoomControl } from '@/hooks/useZoomControl';
import { useToast } from "@/hooks/use-toast";
import { getStyleUrl, MAP_STYLES, type MapStyle } from '@/services/mapService';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Layers, PenTool, Mountain, Satellite, Route, Check, ImageIcon, ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

// Layout principal do mapa técnico com todas as funcionalidades integradas
const TechnicalMapLayout = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
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
  const { zoomIn, zoomOut, currentZoom, maxZoom, minZoom, zoomProgress, isZooming } = useZoomControl();
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

  // Camera Menu component
  const CameraMenu = () => (
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
  );

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
        <div 
          className="relative">
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Mapa Principal */}
      <SimpleBaseMap className="w-full h-screen" showNativeControls={false} />

      {/* Header com Navegação - Estilo iOS */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="bg-background/80 backdrop-blur-lg border-b border-border/20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="rounded-full hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mapa Técnico</span>
              </div>
            </div>
            
            <Badge variant="outline" className="text-xs">
              FlowAgro v2.0
            </Badge>
          </div>
        </div>
      </div>

      {/* Controles Principais - Top Left */}
      <div className="absolute top-20 left-4 z-20 flex gap-2">
        <div className="relative">
          <Button 
            ref={layersButtonRef}
            variant={showLayersMenu ? "default" : "secondary"} 
            size="sm" 
            onClick={() => setShowLayersMenu(!showLayersMenu)} 
            className={cn(
              "rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-200",
              "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
              showLayersMenu ? "bg-[rgb(0,87,255)] text-white" : "bg-card/95"
            )}
            disabled={isLayerChanging}
          >
            {isLayerChanging ? (
              <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
            ) : (
              <Layers className="h-4 w-4" />
            )}
            <span className="ml-2 text-xs font-medium">Camadas</span>
          </Button>
          
          {showLayersMenu && <LayersMenu />}
        </div>

        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setShowDrawingTools(!showDrawingTools)}
          className={cn(
            "rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-200",
            "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
            showDrawingTools ? "bg-[rgb(0,87,255)] text-white" : "bg-card/95"
          )}
        >
          <PenTool className="h-4 w-4" />
          <span className="ml-2 text-xs font-medium">Desenhar</span>
        </Button>

        <div className="relative">
          <Button 
            ref={cameraButtonRef}
            variant="secondary" 
            size="sm" 
            onClick={() => setShowCameraMenu(!showCameraMenu)}
            className={cn(
              "rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-200",
              "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
              showCameraMenu ? "bg-[rgb(0,87,255)] text-white" : "bg-card/95"
            )}
            disabled={cameraActive}
          >
            {cameraActive ? (
              <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            <span className="ml-2 text-xs font-medium">Câmera</span>
          </Button>
          
          {showCameraMenu && <CameraMenu />}
        </div>
      </div>

      {/* Controles de Navegação Consolidados - Top Right */}
      <NavigationControlsHub
        className="absolute top-20 right-4 z-20"
        showZoomIndicator={true}
        showCompass={true}
        showLocationTracker={true}
        showMiniMap={false}
        layout="compact"
      />

      {/* DrawingTools Panel */}
      {showDrawingTools && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="mx-auto max-w-2xl">
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
          </div>
        </div>
      )}

      {/* Floating Action Buttons - Sistema Premium */}
      <MapFloatingActions
        onCameraCapture={handleCameraCapture}
        onMapStyleChange={setMapLayer}
        onMeasurementStart={() => setShowDrawingTools(true)}
        className="z-20"
      />

      {/* Status de Alteração de Camada */}
      {isLayerChanging && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-card/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border animate-scale-in">
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              <div>
                <div>Alterando camada para <strong>{currentLayer}</strong></div>
                <div className="text-xs text-muted-foreground mt-1">
                  Processando dados MapTiler...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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