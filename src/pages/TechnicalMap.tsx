import React, { useState, useRef, useEffect } from "react";
import { MapProvider, useMap } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { 
  SimpleBaseMap,
  DrawingToolsPanel,
  LocationTracker,
  NDVIControls,
  NDVIAnalysis,
  NDVIHistory,
  preloadCriticalMapComponents
} from "@/components/maps/MapComponentRegistry";
import { MapFloatingActions } from "@/components/maps/MapFloatingActions";
import { PinControls } from "@/components/maps/PinControls";
import { LocationFooter } from "@/components/maps/LocationFooter";
import { ResponsiveBottomSheet } from "@/components/maps/ResponsiveBottomSheet";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from '@/hooks/useMapInstance';
import { useZoomControl } from '@/hooks/useZoomControl';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from "@/hooks/use-toast";
import { getStyleUrl, MAP_STYLES, type MapStyle } from '@/services/mapService';
import { DevOnly, DebugInfo, devFeatures } from '@/lib/developmentUtils';
import { performanceMonitor } from '@/lib/unifiedPerformance';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Camera, Layers, PenTool, Mountain, Satellite, Route, Check, ImageIcon, ArrowLeft, Home, Target, Leaf, MapPin, Navigation, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

function TechnicalMapContent() {
  const { toast } = useToast();
  
  // Optimized hooks
  const mapContext = useMap();
  const navigation = useMapNavigation();
  const zoomControl = useZoomControl();
  const userLocation = useUserLocation();
  const mapDrawing = useMapDrawing();
  
  // UI State
  const [currentStyle, setCurrentStyle] = useState<MapStyle>("satellite");
  const [showNDVI, setShowNDVI] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showCameraCard, setShowCameraCard] = useState(false);

  // Preload critical components on mount
  useEffect(() => {
    preloadCriticalMapComponents();
  }, []);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.measure('technical-map-lifecycle', () => {
        if (import.meta.env.DEV) {
          console.log(`TechnicalMap lifecycle: ${Math.round(loadTime)}ms`);
        }
      });
    };
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onLayersOpen: () => setActiveSheet('layers'),
    onLocationOpen: () => setActiveSheet('location'),
    onNDVIOpen: () => setActiveSheet('ndvi'),
    onPinsOpen: () => setActiveSheet('pins'),
    onDrawingOpen: () => setActiveSheet('drawing'),
    onCameraOpen: () => setActiveSheet('camera'),
    onClose: () => setActiveSheet(null)
  });

  // Optimized map interactions
  const handleMapClick = (event: any) => {
    if (import.meta.env.DEV) {
      console.log('Map clicked', event.lngLat);
    }
  };

  const handleLocationClick = async () => {
    try {
      await userLocation.centerOnLocation();
      toast({
        title: "📍 Localização encontrada",
        description: "Mapa centralizado na sua posição atual"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível obter sua localização";
      toast({
        title: "❌ Erro de localização",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleStyleChange = (style: MapStyle) => {
    setCurrentStyle(style);
    mapContext?.setStyle?.(getStyleUrl(style));
    
    toast({
      title: "Estilo alterado",
      description: `Visualização alterada para ${style}`
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <FullscreenTransitions>
        <SimpleBaseMap 
          style={getStyleUrl(currentStyle)}
          onLoad={() => {
            if (import.meta.env.DEV) {
              console.log('Map loaded successfully');
            }
          }}
          onClick={handleMapClick}
        />
        
        {/* Core Components */}
        <LocationTracker />
        <DrawingToolsPanel />
        <PinControls />
        
        {/* Feature Components */}
        {showNDVI && (
          <>
            <NDVIControls />
            <NDVIAnalysis />
          </>
        )}

        {/* Floating Action Buttons */}
        <MapFloatingActions 
          onLayersClick={() => setActiveSheet('layers')}
          onLocationClick={handleLocationClick}
          onCameraClick={() => setActiveSheet('camera')}
          onDrawingClick={() => setActiveSheet('drawing')}
        />

        {/* Location Footer */}
        <LocationFooter 
          position={userLocation.currentPosition}
          accuracy={userLocation.accuracy}
          onLocationClick={handleLocationClick}
        />

        {/* Bottom Sheet */}
        <ResponsiveBottomSheet 
          isOpen={!!activeSheet}
          onClose={() => setActiveSheet(null)}
          title={getSheetTitle(activeSheet)}
        >
          {renderSheetContent(activeSheet, {
            currentStyle,
            onStyleChange: handleStyleChange,
            showNDVI,
            onNDVIToggle: () => setShowNDVI(!showNDVI),
            onCameraOpen: () => setCameraActive(true),
            mapDrawing
          })}
        </ResponsiveBottomSheet>

        {/* NDVI History Modal */}
        {showHistory && (
          <div className="absolute inset-0 z-50 bg-background">
            <NDVIHistory 
              farmId={selectedFarm || undefined}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}

        {/* Debug Components - Only in Development */}
        <DevOnly>
          <DebugInfo 
            data={{
              mapReady: mapContext?.isReady,
              currentStyle,
              showNDVI,
              userLocation: userLocation.currentPosition,
              isDrawing: mapDrawing.isDrawing
            }}
            title="Map Debug"
          />
        </DevOnly>
      </FullscreenTransitions>
    </div>
  );
}

// Helper functions
function getSheetTitle(activeSheet: string | null): string {
  switch (activeSheet) {
    case 'layers': return 'Camadas do Mapa';
    case 'location': return 'Localização GPS';
    case 'camera': return 'Câmera';
    case 'drawing': return 'Ferramentas de Desenho';
    case 'ndvi': return 'Análise NDVI';
    case 'pins': return 'Marcadores';
    default: return '';
  }
}

function renderSheetContent(
  activeSheet: string | null, 
  options: {
    currentStyle: MapStyle;
    onStyleChange: (style: MapStyle) => void;
    showNDVI: boolean;
    onNDVIToggle: () => void;
    onCameraOpen: () => void;
    mapDrawing: any;
  }
) {
  const { currentStyle, onStyleChange, showNDVI, onNDVIToggle, onCameraOpen, mapDrawing } = options;

  switch (activeSheet) {
    case 'layers':
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Estilos Base do Mapa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MAP_STYLES.map((style) => (
                <Button
                  key={style.id}
                  onClick={() => onStyleChange(style.id as MapStyle)}
                  variant={currentStyle === style.id ? "default" : "outline"}
                  className="w-full justify-start"
                >
                  <style.icon className="h-4 w-4 mr-2" />
                  <span>{style.name}</span>
                  {currentStyle === style.id && <Check className="ml-auto h-4 w-4" />}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      );

    case 'camera':
      return (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <Camera className="w-12 h-12 mx-auto text-primary" />
            <h3 className="font-semibold">Capturar Imagem</h3>
            <p className="text-sm text-muted-foreground">
              Capture fotos da área ou escolha da galeria
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Button onClick={onCameraOpen} className="w-full justify-start h-12" variant="outline">
              <Camera className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Abrir Câmera</div>
                <div className="text-xs text-muted-foreground">Tirar nova foto</div>
              </div>
            </Button>
          </div>
        </div>
      );

    case 'drawing':
      return (
        <div className="space-y-4">
          <DrawingToolsPanel 
            activeTool={mapDrawing.activeTool}
            onToolSelect={mapDrawing.setActiveTool}
            isDrawingMode={mapDrawing.isDrawing}
            onStartDrawing={mapDrawing.startDrawing}
            onFinishDrawing={mapDrawing.finishDrawing}
            onCancelDrawing={mapDrawing.cancelDrawing}
            onClearAll={mapDrawing.clearAllShapes}
          />
        </div>
      );

    case 'ndvi':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              <span className="text-sm font-medium">Análise NDVI</span>
            </div>
            <Switch checked={showNDVI} onCheckedChange={onNDVIToggle} />
          </div>
          {showNDVI && <NDVIControls />}
        </div>
      );

    default:
      return null;
  }
}

export default function TechnicalMap() {
  return (
    <MapProvider>
      <TechnicalMapContent />
    </MapProvider>
  );
}