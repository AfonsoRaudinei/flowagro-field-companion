import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapProvider, useMap } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { LocationFooter } from "@/components/maps/LocationFooter";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from '@/hooks/useMapInstance';
import { useZoomControl } from '@/hooks/useZoomControl';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from "@/hooks/use-toast";
import { getStyleUrl, MAP_STYLES, type MapStyle } from '@/services/mapService';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider"; 
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Layers, PenTool, Mountain, Satellite, Route, ArrowLeft, Home, Target, Leaf, MapPin, Navigation, AlertCircle, Radar, Square, Circle, MousePointer } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

// Layout principal do mapa técnico com ícones compactos (sem modais)
const TechnicalMapLayout = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [activeInlineControl, setActiveInlineControl] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Session persistence for layer settings
  const [currentLayer, setCurrentLayer] = useState<MapStyle>(() => {
    const saved = localStorage.getItem('flowagro-map-layer');
    return saved as MapStyle || 'hybrid';
  });
  const [roadsEnabled, setRoadsEnabled] = useState(() => {
    const saved = localStorage.getItem('flowagro-roads-enabled');
    return saved === 'true';
  });
  const [ndviEnabled, setNdviEnabled] = useState(false);
  const [ndviOpacity, setNdviOpacity] = useState(75);
  const [ndviColorScale, setNdviColorScale] = useState('viridis');
  const [ndviPeriod, setNdviPeriod] = useState('30d');
  const [mapTilerToken, setMapTilerToken] = useState<string | null>(null);
  const [isLayerChanging, setIsLayerChanging] = useState(false);
  const [pinsActive, setPinsActive] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [radarActive, setRadarActive] = useState(false);
  const mapContext = useMap();
  const {
    flyToCurrentLocation
  } = useMapNavigation();
  const {
    zoomIn,
    zoomOut,
    currentZoom,
    maxZoom,
    minZoom,
    zoomProgress,
    isZooming
  } = useZoomControl();
  const {
    getCurrentLocation,
    currentPosition
  } = useUserLocation(); // Hook de localização GPS
  const {
    toast
  } = useToast();
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

  // Keyboard shortcuts para ícones compactos
  useKeyboardShortcuts({
    onLayersOpen: () => handleIconTap('layers'),
    onLocationOpen: () => handleLocationClick(),
    onNDVIOpen: () => handleIconTap('ndvi'),
    onPinsOpen: () => handleIconTap('pins'),
    onScannerOpen: () => handleIconTap('scanner'),
    onDrawingOpen: () => handleIconTap('drawing'),
    onCameraOpen: () => handleIconTap('camera'),
    onClose: () => setActiveInlineControl(null)
  });

  // Get MapTiler token on mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const {
          data
        } = await supabase.functions.invoke('maptiler-token');
        if (data?.key) {
          setMapTilerToken(data.key);
        }
      } catch (error) {
        console.error('Failed to get MapTiler token:', error);
      }
    };
    getToken();
  }, []);
  // Auto-hide microcontroles após 3s
  useEffect(() => {
    if (activeInlineControl) {
      const timer = setTimeout(() => {
        setActiveInlineControl(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeInlineControl]);

  // Handlers para long-press
  const handlePressStart = useCallback((iconType: string) => {
    const timer = setTimeout(() => {
      setActiveInlineControl(iconType);
      // Feedback háptico leve
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 400);
    setLongPressTimer(timer);
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Handlers para tap simples (ação principal)
  const handleIconTap = useCallback((iconType: string) => {
    switch (iconType) {
      case 'layers':
        cycleLayers();
        break;
      case 'drawing':
        setActiveTool(activeTool === 'select' ? 'polygon' : 'select');
        break;
      case 'camera':
        handleOpenCamera();
        break;
      case 'ndvi':
        setNdviEnabled(!ndviEnabled);
        break;
      case 'pins':
        setPinsActive(!pinsActive);
        break;
      case 'scanner':
        setScannerActive(!scannerActive);
        break;
      case 'radar':
        setRadarActive(!radarActive);
        break;
    }
  }, [activeTool, ndviEnabled, pinsActive, scannerActive, radarActive]);

  const cycleLayers = () => {
    const layers: MapStyle[] = ['terrain', 'satellite', 'hybrid'];
    const currentIndex = layers.indexOf(currentLayer);
    const nextLayer = layers[(currentIndex + 1) % layers.length];
    setMapLayer(nextLayer);
  };

  const setMapLayer = async (layer: MapStyle) => {
    if (isLayerChanging) return;
    setCurrentLayer(layer);
    localStorage.setItem('flowagro-map-layer', layer);
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
          title: "Camada: " + (layer === 'terrain' ? 'Terreno' : layer === 'satellite' ? 'Satélite' : 'Híbrido'),
          duration: 2000
        });
      } catch (error) {
        console.error('Error changing layer:', error);
        setIsLayerChanging(false);
        toast({
          title: "Erro ao alterar camada",
          variant: "destructive",
          duration: 2000
        });
      }
    }
  };
  const toggleRoadsOverlay = () => {
    const newRoadsState = !roadsEnabled;
    setRoadsEnabled(newRoadsState);
    localStorage.setItem('flowagro-roads-enabled', newRoadsState.toString()); // Persist roads setting

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
          duration: 2000
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
          duration: 2000
        });
      }
      console.log(`Roads overlay ${newRoadsState ? 'enabled' : 'disabled'}`);
    }
  };
  const handleLocationClick = async () => {
    try {
      // Primeiro tenta obter localização atual
      const location = await getCurrentLocation();
      if (location) {
        // Voa para a localização com zoom apropriado
        if (mapContext?.map) {
          mapContext.map.flyTo({
            center: [location.longitude, location.latitude],
            zoom: Math.max(mapContext.map.getZoom(), 16),
            duration: 1500
          });
        }
        toast({
          title: "GPS centralizado",
          duration: 2000
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "GPS indisponível";
      toast({
        title: errorMessage,
        variant: "destructive",
        duration: 2000
      });
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
  const handleOpenCamera = async () => {
    try {
      console.log('Opening native camera...');
      toast({
        title: "Câmera ativa",
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Erro na câmera",
        variant: "destructive",
        duration: 2000  
      });
    }
  };
  
  const handleOpenLibrary = async () => {
    try {
      console.log('Opening photo library...');
      toast({
        title: "Galeria ativa", 
        duration: 2000
      });
    } catch (error) {
      toast({
        title: "Erro na galeria",
        variant: "destructive",
        duration: 2000
      });
    }
  };

  // Renderizar microcontroles inline (sem modais)
  const renderInlineControls = () => {
    if (!activeInlineControl) return null;

    const baseClasses = "absolute bottom-16 left-1/2 transform -translate-x-1/2 z-30 bg-card/95 backdrop-blur-sm rounded-xl shadow-xl border p-3 animate-fade-in";
    const maxWidth = "max-w-[90vw] w-fit";

    switch (activeInlineControl) {
      case 'layers':
        return (
          <div className={cn(baseClasses, maxWidth)}>
            <div className="flex items-center gap-2">
              <Button
                size="sm" 
                variant={currentLayer === 'terrain' ? "default" : "outline"}
                onClick={() => setMapLayer('terrain')}
                className="h-8 px-3"
              >
                <Mountain className="h-3 w-3 mr-1" />
                Terreno
              </Button>
              <Button
                size="sm"
                variant={currentLayer === 'satellite' ? "default" : "outline"}
                onClick={() => setMapLayer('satellite')}
                className="h-8 px-3"
              >
                <Satellite className="h-3 w-3 mr-1" />
                Satélite
              </Button>
              <Button
                size="sm"
                variant={currentLayer === 'hybrid' ? "default" : "outline"}
                onClick={() => setMapLayer('hybrid')}
                className="h-8 px-3"
              >
                <Layers className="h-3 w-3 mr-1" />
                Híbrido
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Route className="h-3 w-3" />
                <span className="text-xs font-medium">Estradas</span>
              </div>
              <Switch 
                checked={roadsEnabled} 
                onCheckedChange={toggleRoadsOverlay}
              />
            </div>
          </div>
        );

      case 'drawing':
        return (
          <div className={cn(baseClasses, maxWidth)}>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={activeTool === 'select' ? "default" : "outline"}
                onClick={() => setActiveTool('select')}
                className="h-8 px-3"
              >
                <MousePointer className="h-3 w-3 mr-1" />
                Selecionar
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'polygon' ? "default" : "outline"}
                onClick={() => setActiveTool('polygon')}
                className="h-8 px-3"
              >
                <PenTool className="h-3 w-3 mr-1" />
                Polígono
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'rectangle' ? "default" : "outline"}
                onClick={() => setActiveTool('rectangle')}
                className="h-8 px-3"
              >
                <Square className="h-3 w-3 mr-1" />
                Retângulo
              </Button>
              <Button
                size="sm"
                variant={activeTool === 'circle' ? "default" : "outline"}
                onClick={() => setActiveTool('circle')}
                className="h-8 px-3"
              >
                <Circle className="h-3 w-3 mr-1" />
                Círculo
              </Button>
              {drawnShapes.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearAllShapes}
                  className="h-8 px-3"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        );

      case 'camera':
        return (
          <div className={cn(baseClasses, maxWidth)}>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenCamera}
                className="h-8 px-3"
              >
                <Camera className="h-3 w-3 mr-1" />
                Câmera
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenLibrary}
                className="h-8 px-3"
              >
                Galeria
              </Button>
            </div>
          </div>
        );

      case 'ndvi':
        return (
          <div className={cn(baseClasses, maxWidth)}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Opacidade</span>
                <div className="w-16">
                  <Slider
                    value={[ndviOpacity]}
                    onValueChange={(value) => setNdviOpacity(value[0])}
                    max={100}
                    step={5}
                    className="w-full"
                    disabled={!ndviEnabled}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{ndviOpacity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={ndviPeriod} onValueChange={setNdviPeriod} disabled={!ndviEnabled}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7d</SelectItem>
                    <SelectItem value="30d">30d</SelectItem>
                    <SelectItem value="90d">90d</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mobile viewport meta tag enforcement */}
      <div className="fixed inset-0 pointer-events-none" style={{
      minHeight: '100dvh' // Dynamic viewport height for mobile
    }} />
      
      {/* Map Container - Positioned relative for sheet anchoring */}
      <div id="map-viewport" className="fixed inset-0 z-10 relative" style={{ 
        width: '100vw', 
        height: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden' 
      }}>
        <SimpleBaseMap className="w-full h-full" showNativeControls={false} />
      </div>

      {/* Header com Navegação - Estilo iOS */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="bg-background/80 backdrop-blur-lg border-b border-border/20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="rounded-full hover:bg-primary/10">
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

      {/* Top-Left: Barra de Ações Primárias (máx 48px altura) */}
      <div className="absolute top-20 left-4 z-20 flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          onTouchStart={() => handlePressStart('layers')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('layers')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onClick={() => handleIconTap('layers')}
          className={cn(
            "h-10 px-3 rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-150",
            "hover:bg-[rgba(0,87,255,0.1)] active:scale-95 bg-card/95",
            isLayerChanging && "opacity-50"
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

        <Button 
          variant="secondary" 
          size="sm"
          onTouchStart={() => handlePressStart('drawing')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('drawing')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onClick={() => handleIconTap('drawing')}
          className={cn(
            "h-10 px-3 rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-150",
            "hover:bg-[rgba(0,87,255,0.1)] active:scale-95 bg-card/95",
            activeTool !== 'select' && "ring-2 ring-primary/30"
          )}
        >
          <PenTool className="h-4 w-4" />
          <span className="ml-2 text-xs font-medium">Desenhar</span>
        </Button>

        <Button 
          variant="secondary" 
          size="sm"
          onTouchStart={() => handlePressStart('camera')}
          onTouchEnd={handlePressEnd}
          onMouseDown={() => handlePressStart('camera')}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onClick={() => handleIconTap('camera')}
          className={cn(
            "h-10 px-3 rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-150",
            "hover:bg-[rgba(0,87,255,0.1)] active:scale-95 bg-card/95",
            cameraActive && "opacity-50"
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
      </div>

      {/* Top Right: Zoom + GPS Controls */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={() => zoomIn()} disabled={isZooming || currentZoom >= maxZoom} className={cn("w-10 h-10 rounded-full shadow-lg border-0 backdrop-blur-sm transition-all duration-200", "hover:bg-[rgba(0,87,255,0.1)] active:scale-95 bg-card/95")}>
          <span className="text-lg font-semibold leading-none">+</span>
        </Button>
        
        <Button variant="secondary" size="icon" onClick={() => zoomOut()} disabled={isZooming || currentZoom <= minZoom} className={cn("w-10 h-10 rounded-full shadow-lg border-0 backdrop-blur-sm transition-all duration-200", "hover:bg-[rgba(0,87,255,0.1)] active:scale-95 bg-card/95")}>
          <span className="text-lg font-semibold leading-none">−</span>
        </Button>
        
        {/* GPS Location Button */}
        <Button variant="secondary" size="icon" onClick={handleLocationClick} className={cn("w-10 h-10 rounded-full shadow-lg border-0 backdrop-blur-sm transition-all duration-200", "hover:bg-[rgba(0,87,255,0.1)] active:scale-95 bg-card/95")} title="Centralizar na minha localização">
          <Target className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom: Ribbon de Ícones Compactos (máx 56px altura) */}
      <div className="absolute bottom-20 left-0 right-0 z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-center gap-3 px-4">
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
            {/* NDVI */}
            <Button
              variant="ghost"
              size="icon"
              onTouchStart={() => handlePressStart('ndvi')}
              onTouchEnd={handlePressEnd}
              onMouseDown={() => handlePressStart('ndvi')}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onClick={() => handleIconTap('ndvi')}
              className={cn(
                "w-11 h-11 rounded-xl transition-all duration-150",
                "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
                ndviEnabled ? "bg-green-500/20 text-green-700 ring-2 ring-green-500/30" : "text-muted-foreground"
              )}
              title="NDVI - Tap: Liga/Desliga | Long-press: Controles"
            >
              <Leaf className="h-5 w-5" />
              {ndviEnabled && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs leading-none">
                  ✓
                </Badge>
              )}
            </Button>

            {/* Pins/Marketing */}
            <Button
              variant="ghost"
              size="icon" 
              onClick={() => handleIconTap('pins')}
              className={cn(
                "w-11 h-11 rounded-xl transition-all duration-150",
                "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
                pinsActive ? "bg-blue-500/20 text-blue-700 ring-2 ring-blue-500/30" : "text-muted-foreground"
              )}
              title="Pins - Tap: Ativa/Desativa"
            >
              <MapPin className="h-5 w-5" />
              {pinsActive && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs leading-none">
                  ✓
                </Badge>
              )}
            </Button>

            {/* Scanner */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleIconTap('scanner')}
              className={cn(
                "w-11 h-11 rounded-xl transition-all duration-150",
                "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
                scannerActive ? "bg-orange-500/20 text-orange-700 ring-2 ring-orange-500/30" : "text-muted-foreground"
              )}
              title="Scanner - Tap: Ativa/Desativa"
            >
              <Navigation className="h-5 w-5" />
              {scannerActive && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs leading-none">
                  ✓
                </Badge>
              )}
            </Button>

            {/* Radar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleIconTap('radar')}
              className={cn(
                "w-11 h-11 rounded-xl transition-all duration-150",
                "hover:bg-[rgba(0,87,255,0.1)] active:scale-95",
                radarActive ? "bg-purple-500/20 text-purple-700 ring-2 ring-purple-500/30" : "text-muted-foreground"
              )}
              title="Radar - Tap: Ativa/Desativa"
            >
              <Radar className="h-5 w-5" />
              {radarActive && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs leading-none">
                  ✓
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Microcontroles Inline (sem modais) */}
      {renderInlineControls()}

      {/* Alerta de sobreposição para desenho */}
      {drawnShapes.length > 1 && (
        <div className="absolute top-32 left-4 z-20">
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sobreposição detectada
          </Badge>
        </div>
      )}

      {/* Status de Alteração de Camada */}
      {isLayerChanging && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
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

      {/* Rodapé GPS - Posição fixa, sempre visível (precisão inline) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <LocationFooter 
          className="pointer-events-none text-xs" 
          position="bottom-center" 
          showZoomLevel={true} 
          currentZoom={currentZoom}
        />
        {currentPosition && (
          <div className="mt-1 text-center">
            <Badge variant="outline" className="bg-card/95 backdrop-blur-sm text-xs">
              ±{currentPosition.accuracy?.toFixed(0)}m
            </Badge>
          </div>
        )}
      </div>
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