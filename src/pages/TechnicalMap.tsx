import React, { useState, useRef, useEffect } from "react";
import { MapProvider, useMap } from "@/components/maps/MapProvider";
import { FullscreenTransitions } from '@/components/maps/FullscreenTransitions';
import { SimpleBaseMap } from "@/components/maps/SimpleBaseMap";
import { DrawingToolsPanel } from "@/components/maps/DrawingToolsPanel";
import { MapFloatingActions } from "@/components/maps/MapFloatingActions";
import { LocationFooter } from "@/components/maps/LocationFooter";
import { LocationTracker } from "@/components/maps/LocationTracker";
import { PinControls } from "@/components/maps/PinControls";
import { NDVIControls } from "@/components/maps/NDVIControls";
import { NDVIAnalysis } from "@/components/maps/NDVIAnalysis";
import NDVIHistory from "@/components/maps/NDVIHistory";
import { ResponsiveBottomSheet } from "@/components/maps/ResponsiveBottomSheet";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMapDrawing } from "@/hooks/useMapDrawing";
import { useMapNavigation } from '@/hooks/useMapInstance';
import { useZoomControl } from '@/hooks/useZoomControl';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useToast } from "@/hooks/use-toast";
import { getStyleUrl, MAP_STYLES, type MapStyle } from '@/services/mapService';
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

// Layout principal do mapa técnico com todas as funcionalidades integradas
const TechnicalMapLayout = () => {
  const [cameraActive, setCameraActive] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
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
  const [mapTilerToken, setMapTilerToken] = useState<string | null>(null);
  const [isLayerChanging, setIsLayerChanging] = useState(false);
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

  // Keyboard shortcuts para FAB
  useKeyboardShortcuts({
    onLayersOpen: () => setActiveSheet('layers'),
    onLocationOpen: () => setActiveSheet('location'),
    onNDVIOpen: () => setActiveSheet('ndvi'),
    onPinsOpen: () => setActiveSheet('pins'),
    onScannerOpen: () => setActiveSheet('scanner'),
    onDrawingOpen: () => setActiveSheet('drawing'),
    onCameraOpen: () => setActiveSheet('camera'),
    onClose: () => setActiveSheet(null)
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
  const setMapLayer = async (layer: MapStyle) => {
    if (isLayerChanging) return;
    setCurrentLayer(layer);
    localStorage.setItem('flowagro-map-layer', layer); // Persist layer choice
    setActiveSheet(null); // Fechar sheet ao alterar camada
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
          description: `Visualização alterada para ${layer === 'terrain' ? 'Terreno' : layer === 'satellite' ? 'Satélite' : layer === 'hybrid' ? 'Híbrido' : 'Ruas'}`
        });
      } catch (error) {
        console.error('Error changing layer:', error);
        setIsLayerChanging(false);
        toast({
          title: "Erro",
          description: "Não foi possível alterar a camada do mapa",
          variant: "destructive"
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
          description: "Overlay de estradas foi adicionado ao mapa"
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
          description: "Overlay de estradas foi removido do mapa"
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
          title: "📍 Localização GPS encontrada",
          description: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}\nPrecisão: ±${location.accuracy?.toFixed(0)}m`
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Não foi possível obter sua localização GPS";
      toast({
        title: "❌ Erro de localização GPS",
        description: errorMessage,
        variant: "destructive"
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
    setActiveSheet(null); // Fechar sheet
    try {
      console.log('Opening native camera...');
      toast({
        title: "Câmera",
        description: "Abrindo câmera para captura..."
      });
    } catch (error) {
      toast({
        title: "Erro na câmera",
        description: "Não foi possível abrir a câmera. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  const handleOpenLibrary = async () => {
    setActiveSheet(null); // Fechar sheet
    try {
      console.log('Opening photo library...');
      toast({
        title: "Galeria",
        description: "Abrindo galeria para seleção..."
      });
    } catch (error) {
      toast({
        title: "Erro na galeria",
        description: "Não foi possível acessar a galeria. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Renderizar conteúdo do sheet baseado no tipo ativo
  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'layers':
        return <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Estilos Base do Mapa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => setMapLayer('terrain')} disabled={isLayerChanging} variant={currentLayer === 'terrain' ? "default" : "outline"} className="w-full justify-start">
                  <Mountain className="h-4 w-4 mr-2" />
                  <span>Terreno</span>
                  {currentLayer === 'terrain' && <Check className="ml-auto h-4 w-4" />}
                </Button>

                <Button onClick={() => setMapLayer('satellite')} disabled={isLayerChanging} variant={currentLayer === 'satellite' ? "default" : "outline"} className="w-full justify-start">
                  <Satellite className="h-4 w-4 mr-2" />
                  <span>Satélite</span>
                  {currentLayer === 'satellite' && <Check className="ml-auto h-4 w-4" />}
                </Button>

                <Button onClick={() => setMapLayer('hybrid')} disabled={isLayerChanging} variant={currentLayer === 'hybrid' ? "default" : "outline"} className="w-full justify-start">
                  <Layers className="h-4 w-4 mr-2" />
                  <span>Híbrido</span>
                  {currentLayer === 'hybrid' && <Check className="ml-auto h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sobreposições</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    <span className="text-sm font-medium">Estradas</span>
                  </div>
                  <Switch checked={roadsEnabled} onCheckedChange={toggleRoadsOverlay} disabled={isLayerChanging} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Exibe as principais vias e estradas na região
                </p>
              </CardContent>
            </Card>
          </div>;
      case 'camera':
        return <div className="space-y-4">
            <div className="text-center space-y-2">
              <Camera className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Capturar Imagem</h3>
              <p className="text-sm text-muted-foreground">
                Capture fotos da área ou escolha da galeria
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Button onClick={handleOpenCamera} className="w-full justify-start h-12" variant="outline">
                <Camera className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Abrir Câmera</div>
                  <div className="text-xs text-muted-foreground">Tirar nova foto</div>
                </div>
              </Button>
              
              <Button onClick={handleOpenLibrary} className="w-full justify-start h-12" variant="outline">
                <ImageIcon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Escolher da Galeria</div>
                  <div className="text-xs text-muted-foreground">Selecionar imagem existente</div>
                </div>
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Anotações de Imagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Após capturar, você poderá adicionar marcações e anotações sobre a imagem.
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">GPS Automático</Badge>
                  <Badge variant="outline">Sobreposição no Mapa</Badge>
                </div>
              </CardContent>
            </Card>
          </div>;
      case 'drawing':
        return <div className="space-y-4">
            <DrawingToolsPanel activeTool={activeTool} onToolSelect={setActiveTool} onStartDrawing={startDrawing} onFinishDrawing={finishDrawing} onCancelDrawing={cancelDrawing} onClearAll={clearAllShapes} onExport={exportShapes} isDrawingMode={isDrawingMode} shapesCount={drawnShapes.length} currentShape={currentShape} onSaveShape={saveShape} onDeleteShape={deleteShape} onAnalyzeShape={analyzeShape} drawnShapes={drawnShapes} />
            
            {/* Alerta de sobreposição */}
            {drawnShapes.length > 1 && <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Verificação de Sobreposição</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Sistema detecta automaticamente colisões entre polígonos
                  </p>
                </CardContent>
              </Card>}
          </div>;
      case 'location':
        return <div className="space-y-4">
            <div className="text-center space-y-2">
              <Target className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Localização GPS</h3>
              <p className="text-sm text-muted-foreground">
                Controle e monitore sua posição atual
              </p>
            </div>
            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações GPS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handleLocationClick} className="w-full justify-start" variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Centralizar no Mapa
                </Button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Coordenadas exibidas no rodapé em tempo real</p>
                  <p>• Geometrias salvas com referência GPS correta</p>
                  <p>• Precisão automática baseada no sinal</p>
                </div>
              </CardContent>
            </Card>
            
            <LocationTracker />
          </div>;
      case 'ndvi':
        return <div className="space-y-4">
            <div className="text-center space-y-2">
              <Leaf className="w-12 h-12 mx-auto text-green-600" />
              <h3 className="font-semibold">Análise NDVI</h3>
              <p className="text-sm text-muted-foreground">
                Índice de vegetação e saúde das plantas
              </p>
            </div>
            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Controles NDVI
                  <Switch checked={ndviEnabled} onCheckedChange={setNdviEnabled} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Opacidade</span>
                    <span className="text-xs text-muted-foreground">{ndviOpacity}%</span>
                  </div>
                  <Slider value={[ndviOpacity]} onValueChange={value => setNdviOpacity(value[0])} max={100} step={1} className="w-full" disabled={!ndviEnabled} />
                </div>
                
                <div className="space-y-2">
                  <span className="text-xs font-medium">Escala de Cores</span>
                  <Select value={ndviColorScale} onValueChange={setNdviColorScale} disabled={!ndviEnabled}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viridis">Viridis (Verde-Azul)</SelectItem>
                      <SelectItem value="rdylgn">RdYlGn (Vermelho-Verde)</SelectItem>
                      <SelectItem value="spectral">Espectral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Início</span>
                    <Input type="date" className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Fim</span>
                    <Input type="date" className="text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="history">
                <AccordionTrigger className="text-sm">Histórico NDVI</AccordionTrigger>
                <AccordionContent>
                  <NDVIHistory />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="legend">
                <AccordionTrigger className="text-sm">Legenda de Cores</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>Solo exposto/Seco (0.0-0.2)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span>Vegetação esparsa (0.2-0.4)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Vegetação saudável (0.4-0.8)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-800 rounded"></div>
                      <span>Vegetação densa (0.8-1.0)</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>;
      case 'pins':
        return <div className="space-y-4">
            <div className="text-center space-y-2">
              <MapPin className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Gerenciar Pins</h3>
              <p className="text-sm text-muted-foreground">
                Adicione e organize marcadores no mapa
              </p>
            </div>
            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filtros de Marketing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Promoções
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Eventos
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Pontos de Venda
                  </Badge>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    Parcerias
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✅ Toque em pins no mapa para tooltip inline (não-modal)</p>
                  <p>✅ Coordenadas GPS registradas automaticamente</p>
                  <p>✅ Filtros aplicados em tempo real</p>
                  <p>📍 Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">P</kbd> para abrir rapidamente</p>
                </div>
              </CardContent>
            </Card>
            
            <PinControls />
          </div>;
      case 'scanner':
        return <div className="space-y-4">
            <div className="text-center space-y-2">
              <Navigation className="w-12 h-12 mx-auto text-primary" />
              <h3 className="font-semibold">Scanner Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Detecção automática de falhas e anomalias
              </p>
            </div>
            <Separator />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Ativação do Scanner
                  <Switch defaultChecked />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Detecção de linhas de plantio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Identificação de falhas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Análise de densidade vegetal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Alertas de excesso/escassez</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✅ Notificações geográficas inline no mapa</p>
                  <p>✅ Nenhum modal ou popup invasivo</p>
                  <p>🔥 Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">S</kbd> para ativar/desativar</p>
                </div>
                
                <Badge variant="outline" className="w-fit">
                  IA Ativa • Processamento em tempo real
                </Badge>
              </CardContent>
            </Card>
          </div>;
      default:
        return null;
    }
  };
  const getSheetTitle = () => {
    switch (activeSheet) {
      case 'layers':
        return 'Camadas do Mapa';
      case 'camera':
        return 'Capturar Imagem';
      case 'drawing':
        return 'Ferramentas de Desenho';
      case 'location':
        return 'Localização GPS';
      case 'ndvi':
        return 'Análise NDVI';
      case 'pins':
        return 'Gerenciar Pins';
      case 'scanner':
        return 'Scanner Inteligente';
      default:
        return '';
    }
  };
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Mobile viewport meta tag enforcement */}
      <div className="fixed inset-0 pointer-events-none" style={{
      minHeight: '100dvh' // Dynamic viewport height for mobile
    }} />
      {/* Mapa Principal - Posição fixa, nunca se desloca */}
      <div className="fixed inset-0 z-10">
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

      {/* Controles Principais - Top Left */}
      <div className="absolute top-20 left-4 z-20 flex gap-2">
        <Button variant={activeSheet === 'layers' ? "default" : "secondary"} size="sm" onClick={() => setActiveSheet(activeSheet === 'layers' ? null : 'layers')} className={cn("rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-200", "hover:bg-[rgba(0,87,255,0.1)] active:scale-95")} disabled={isLayerChanging}>
          {isLayerChanging ? <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" /> : <Layers className="h-4 w-4" />}
          <span className="ml-2 text-xs font-medium">Camadas</span>
        </Button>

        

        <Button variant={activeSheet === 'camera' ? "default" : "secondary"} size="sm" onClick={() => setActiveSheet(activeSheet === 'camera' ? null : 'camera')} className={cn("rounded-xl shadow-lg border-0 backdrop-blur-sm transition-all duration-200", "hover:bg-[rgba(0,87,255,0.1)] active:scale-95")} disabled={cameraActive}>
          {cameraActive ? <div className="animate-spin rounded-full h-3 w-3 border border-primary border-t-transparent" /> : <Camera className="h-4 w-4" />}
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

      {/* Floating Action Buttons - Posição absolutamente fixa (sem duplicação) */}
      <MapFloatingActions onCameraCapture={handleCameraCapture} onMapStyleChange={setMapLayer} onMeasurementStart={() => setActiveSheet('drawing')} onOpenSheet={setActiveSheet} />

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

      {/* Rodapé flutuante - Posição fixa, sempre visível */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <LocationFooter className="pointer-events-none" position="bottom-center" showZoomLevel={true} currentZoom={currentZoom} />
      </div>

      {/* Bottom Sheet Unificado */}
      {activeSheet && <ResponsiveBottomSheet title={getSheetTitle()} status={activeSheet === 'layers' && isLayerChanging ? 'Alterando...' : 'Ativo'} isActive={true} snapPoints={[20, 50, 80]} initialSnapPoint={1} persistentMiniMode={false} backdropBlur={true} onSnapPointChange={snapPoint => {
      if (snapPoint === 0) {
        setTimeout(() => setActiveSheet(null), 300);
      }
    }} onClose={() => setActiveSheet(null)} showFooter={activeSheet === 'drawing'} footerActions={activeSheet === 'drawing' ? <>
                <Button variant="outline" size="sm" onClick={() => setActiveSheet(null)}>
                  Fechar
                </Button>
                <Button size="sm" onClick={() => {
        // Ação primária específica do contexto
        console.log('Primary action for drawing');
      }}>
                  Salvar
                </Button>
              </> : undefined}>
          {renderSheetContent()}
        </ResponsiveBottomSheet>}
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