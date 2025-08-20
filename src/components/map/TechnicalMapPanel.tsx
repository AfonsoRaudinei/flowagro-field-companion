import React, { useEffect, useMemo, useRef, useState } from "react";
import MapView from "@/components/map/MapView";
import MapDrawingControls from "@/components/map/MapDrawingControls";
import { SatelliteLayerSelector } from "@/components/map/SatelliteLayerSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layers, Filter, LocateFixed, PenTool, Edit3, Magnet, Save, ChevronDown, ZoomIn, ZoomOut, Plus, Minus, Camera, Satellite } from "lucide-react";
import { GPSService } from "@/services/gpsService";
import { useGPSState } from "@/hooks/useGPSState";
import { GPSStatusIndicator } from "@/components/GPSStatusIndicator";
import { useMapCapture } from "@/hooks/useMapCapture";
import { toast } from "@/hooks/use-toast";

// Minimal geo helpers (planar approximation)
function polygonArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % coords.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

function perimeter(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    p += Math.sqrt(dx * dx + dy * dy);
  }
  return p;
}

function centroid(coords: [number, number][]): [number, number] | null {
  if (coords.length < 3) return null;
  let x = 0,
    y = 0,
    f: number;
  let A = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    f = coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1];
    x += (coords[i][0] + coords[i + 1][0]) * f;
    y += (coords[i][1] + coords[i + 1][1]) * f;
    A += f;
  }
  A *= 0.5;
  if (A === 0) return null;
  x /= 6 * A;
  y /= 6 * A;
  return [y, x];
}

const layerOptions = [
  { id: "satellite", label: "Satélite", color: "bg-blue-500" },
  { id: "ndvi", label: "NDVI", color: "bg-green-500" },
  { id: "solo", label: "Solo", color: "bg-amber-600" },
  { id: "marketing", label: "Marketing", color: "bg-blue-400" },
  { id: "ocorrencias", label: "Ocorrências", color: "bg-red-500" },
  { id: "talhoes", label: "Talhões", color: "bg-purple-500" },
  { id: "clima", label: "Clima", color: "bg-sky-400" },
  { id: "radar", label: "Radar", color: "bg-orange-500" },
];


const TechnicalMapPanel: React.FC = () => {
  const [center, setCenter] = useState<[number, number]>([-23.55, -46.63]);
  const [zoom, setZoom] = useState(13);
  const [baseLayerId, setBaseLayerId] = useState<"streets" | "satellite" | "terrain">("satellite");

  // UI states
  const [query, setQuery] = useState("");
  const [layersOpen, setLayersOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({});
  const [filterOn, setFilterOn] = useState(false);

  // Drawing states
  const [drawingMode, setDrawingMode] = useState<"polygon" | "rectangle" | "circle" | "freehand" | null>(null);
  const [editing, setEditing] = useState(false);
  const [snapOn, setSnapOn] = useState(false);
  const [geometry, setGeometry] = useState<GeoJSON.FeatureCollection | null>(null);

  // Bottom panel - auto-open when drawing starts
  const [panelOpen, setPanelOpen] = useState(false);
  
  // Auto-expand panel when drawing mode is activated
  useEffect(() => {
    if (drawingMode) {
      setPanelOpen(true);
    }
  }, [drawingMode]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  
  // Satellite layers
  const [satelliteLayersOpen, setSatelliteLayersOpen] = useState(false);
  const [loadedSatelliteLayers, setLoadedSatelliteLayers] = useState<Array<{
    id: string;
    imageUrl: string;
    metadata: any;
  }>>([]);

  // GPS Hook
  const { gpsState, setGpsState, getCurrentLocationWithFallback, checkGPSBeforeAction } = useGPSState();
  
  // Map Capture Hook
  const { captureMap, shareCapture } = useMapCapture();

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!layersOpen) return;
      const target = e.target as HTMLElement;
      if (!target.closest("#layers-dropdown") && !target.closest("#layers-btn")) {
        setLayersOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [layersOpen]);

  const handleToggleLayer = (id: string) => {
    if (id === "satellite") {
      setSatelliteLayersOpen(true);
      return;
    }
    setActiveLayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSatelliteLayerLoad = (imageUrl: string, metadata: any) => {
    const layerId = `satellite-${Date.now()}`;
    console.log('🛰️ DEBUG - Satellite Layer Load Started:', {
      imageUrl: imageUrl?.substring(0, 100) + '...',
      metadata,
      timestamp: new Date().toISOString()
    });
    
    setLoadedSatelliteLayers(prev => {
      const newLayers = [...prev, { id: layerId, imageUrl, metadata }];
      console.log('🛰️ DEBUG - Updated Satellite Layers:', newLayers.length);
      return newLayers;
    });
    
    setActiveLayers(prev => {
      const updated = { ...prev, [layerId]: true };
      console.log('🛰️ DEBUG - Active Layers Updated:', Object.keys(updated).filter(k => updated[k]));
      return updated;
    });
    
    console.log('✅ Satellite layer loaded successfully:', { layerId, metadata });
  };

  // Calculate current map bbox for satellite requests - CRITICAL FIX
  const currentBbox = useMemo((): [number, number, number, number] => {
    const [lat, lng] = center;
    // More appropriate zoom-based delta calculation
    const zoomFactor = Math.pow(2, 15 - zoom);
    const latDelta = 0.005 * zoomFactor; // Latitude delta
    const lngDelta = 0.005 * zoomFactor / Math.cos(lat * Math.PI / 180); // Longitude delta adjusted for latitude
    
    // Format: [west, south, east, north] = [lng-delta, lat-delta, lng+delta, lat+delta]
    const bbox: [number, number, number, number] = [
      lng - lngDelta,  // west (longitude min)
      lat - latDelta,  // south (latitude min) 
      lng + lngDelta,  // east (longitude max)
      lat + latDelta   // north (latitude max)
    ];
    
    console.log('🗺️ DEBUG - Bbox Calculation:', {
      center: { lat, lng },
      zoom,
      zoomFactor,
      deltas: { latDelta, lngDelta },
      bbox,
      bboxFormatted: `[${bbox[0].toFixed(6)}, ${bbox[1].toFixed(6)}, ${bbox[2].toFixed(6)}, ${bbox[3].toFixed(6)}]`
    });
    
    return bbox;
  }, [center, zoom]);

  const handleLocate = async () => {
    console.log("Botão GPS clicado");
    setGpsState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const location = await getCurrentLocationWithFallback({ lat: center[0], lng: center[1] });
      if (location) {
        console.log("Localizando no mapa:", location);
        setCenter([location.latitude, location.longitude]);
        setZoom(16);
        toast({
          title: "Localização encontrada",
          description: `${location.accuracy}m de precisão - ${location.source === 'gps' ? 'GPS' : location.source === 'cache' ? 'Cache' : 'Aproximada'}`
        });
      } else {
        console.log("Localização não disponível");
        toast({
          title: "Localização indisponível", 
          description: "Não foi possível obter sua localização",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      toast({
        title: "Erro de GPS",
        description: "Falha ao obter localização",
        variant: "destructive"
      });
    } finally {
      setGpsState(prev => ({ ...prev, isChecking: false }));
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 1));
  };

  const handleDrawingMode = (mode: typeof drawingMode) => {
    setDrawingMode(prev => prev === mode ? null : mode);
    setEditing(false);
  };

  const createSamplePolygon = () => {
    const [lat, lng] = center;
    const d = 0.05;
    const coords: [number, number][]= [
      [lat + d, lng - d],
      [lat + d, lng + d],
      [lat - d, lng + d],
      [lat - d, lng - d],
      [lat + d, lng - d],
    ];
    const feature: GeoJSON.Feature = {
      type: "Feature",
      properties: { name: "Talhão A" },
      geometry: {
        type: "Polygon",
        coordinates: [coords.map(([la, lo]) => [lo, la])],
      },
    };
    setGeometry({ type: "FeatureCollection", features: [feature] });
    setPanelOpen(true);
  };

  const metrics = useMemo(() => {
    if (!geometry || geometry.features.length === 0) return null;
    const poly = geometry.features[0].geometry as GeoJSON.Polygon;
    const ll = poly.coordinates[0].map(([lng, lat]) => [lat, lng]) as [number, number][];
    const A = polygonArea(ll);
    const P = perimeter(ll);
    const C = centroid(ll);
    return { areaHa: (A * 12365).toFixed(2), // fake conversion just for UI
             perimM: (P * 111000).toFixed(0),
             centroid: C ? `${C[0].toFixed(5)}, ${C[1].toFixed(5)}` : "-" };
  }, [geometry]);

  return (
    <div className="relative w-full h-screen max-w-md mx-auto bg-background">
      {/* Header Simplificado */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-card/95 backdrop-blur-sm border-b border-border px-3 pt-3 pb-2">
        <div className="flex items-center justify-center">
          <h1 className="text-base font-semibold">Mapa Técnico</h1>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar fazenda, talhão..."
            className="h-10 flex-1"
          />
          <div className="flex items-center gap-1">
            <Button id="layers-btn" onClick={() => setLayersOpen(v=>!v)} variant={layersOpen ? "default" : "secondary"} size="icon" className="h-10 w-10 relative">
              <Layers className="h-5 w-5" />
              {Object.values(activeLayers).some(Boolean) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              )}
            </Button>
            <Button 
              onClick={handleLocate} 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 relative"
              disabled={gpsState.isChecking}
            >
              <LocateFixed className={`h-5 w-5 ${gpsState.isChecking ? 'animate-pulse' : ''}`} />
              <GPSStatusIndicator gpsState={gpsState} className="absolute -top-1 -right-1" />
            </Button>
            <Button onClick={() => setFilterOn(v => !v)} variant={filterOn ? "default" : "secondary"} size="icon" className="h-10 w-10">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {/* Dropdown de Camadas - Posicionado à Direita */}
        <div id="layers-dropdown" className={`absolute right-0 top-full mt-2 z-[1100] w-80 ${layersOpen ? '' : 'hidden'}`}>
          <div className="rounded-md border border-border bg-popover p-3 shadow-lg backdrop-blur-sm">
            <div className="text-xs font-medium text-muted-foreground mb-2">Camadas Disponíveis</div>
            <div className="space-y-2 mb-4">
              {layerOptions.map(layer => (
                <label key={layer.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                  <input 
                    type="checkbox" 
                    checked={!!activeLayers[layer.id]} 
                    onChange={() => handleToggleLayer(layer.id)}
                    className="rounded" 
                  />
                  <div className={`w-3 h-3 rounded ${layer.color}`} />
                  <span className="flex-1">{layer.label}</span>
                  {layer.id === "satellite" && <Satellite className="h-3 w-3 text-muted-foreground" />}
                </label>
              ))}
            </div>
            
            {/* Loaded Satellite Layers */}
            {loadedSatelliteLayers.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">Camadas de Satélite</div>
                <div className="space-y-1">
                  {loadedSatelliteLayers.map((layer) => (
                    <label key={layer.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                      <input 
                        type="checkbox" 
                        checked={!!activeLayers[layer.id]} 
                        onChange={() => setActiveLayers(prev => ({ ...prev, [layer.id]: !prev[layer.id] }))}
                        className="rounded" 
                      />
                      <div className="w-3 h-3 rounded bg-blue-500" />
                      <span className="flex-1 text-xs">{layer.metadata.source} - {layer.metadata.type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs font-medium text-muted-foreground mb-2">Mapa Base</div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "satellite", label: "Satélite" },
                { id: "streets", label: "Ruas" },
                { id: "terrain", label: "Terreno" },
              ].map(opt => (
                <label key={opt.id} className="text-center cursor-pointer">
                  <input
                    type="radio"
                    name="base"
                    checked={baseLayerId === (opt.id as "streets" | "satellite" | "terrain")}
                    onChange={() => setBaseLayerId(opt.id as "streets" | "satellite" | "terrain")}
                    className="sr-only"
                  />
                  <div className={`p-2 text-xs rounded border transition-colors ${
                    baseLayerId === opt.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}>
                    {opt.label}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {/* Satellite Layer Selector Modal */}
        {satelliteLayersOpen && (
          <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Camadas de Satélite</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSatelliteLayersOpen(false)}
                >
                  ×
                </Button>
              </div>
              <div className="p-4">
                <SatelliteLayerSelector
                  bbox={currentBbox}
                  onLayerLoad={handleSatelliteLayerLoad}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botão de Câmera Flutuante */}
      <div className="absolute right-4 bottom-20 z-[1000]">
        <Button 
          variant="default" 
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          onClick={async () => {
            const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
            if (mapElement) {
              const blob = await captureMap(mapElement);
              if (blob) {
                await shareCapture(blob);
              }
            } else {
              toast({
                title: "Captura indisponível",
                description: "Mapa ainda não carregado",
                variant: "destructive"
              });
            }
          }}
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-[110px] pb-[64px]">
        <MapView
          center={center}
          zoom={zoom}
          baseLayerId={baseLayerId}
          geojson={geometry ?? undefined}
          mapChildren={
            <MapDrawingControls
              enabled={!!drawingMode}
              editing={editing}
              snapping={snapOn}
              onChange={(fc) => {
                console.log("Geometria alterada:", fc);
                setGeometry(fc);
                if (fc) setPanelOpen(true);
              }}
            />
          }
        />
      </div>


      {/* Painel Inferior Otimizado com Ferramentas Integradas */}
      <div ref={panelRef} className={`absolute left-0 right-0 bottom-0 z-[1000] border-t border-border bg-card/95 backdrop-blur-sm shadow-lg ${panelOpen ? 'h-[50%]' : 'h-14'} transition-[height] duration-300 rounded-t-lg`}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              {geometry ? 'Área Selecionada' : drawingMode ? 'Ferramentas de Desenho' : 'Mapa Técnico'}
            </h3>
            {geometry && <Badge variant="default" className="text-xs">Ativo</Badge>}
            {drawingMode && <Badge variant="secondary" className="text-xs">Desenhando</Badge>}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(v=>!v)}>
            <ChevronDown className={`h-4 w-4 transition-transform ${panelOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {panelOpen && (
          <div className="px-4 pb-4 space-y-4 overflow-y-auto h-[calc(100%-56px)]">
            {/* Seção de Ferramentas de Desenho */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Ferramentas de Desenho</h4>
                {drawingMode && (
                  <Button onClick={() => setDrawingMode(null)} variant="ghost" size="sm" className="h-6 text-xs">
                    Parar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant={drawingMode === "freehand" ? "default" : "outline"} 
                  onClick={() => handleDrawingMode("freehand")}
                  className="h-9"
                >
                  <PenTool className="h-4 w-4 mr-1" />
                  Mão Livre
                </Button>
                <Button 
                  size="sm" 
                  variant={drawingMode === "polygon" ? "default" : "outline"} 
                  onClick={() => handleDrawingMode("polygon")}
                  className="h-9"
                >
                  Polígono
                </Button>
                <Button 
                  size="sm" 
                  variant={drawingMode === "circle" ? "default" : "outline"} 
                  onClick={() => handleDrawingMode("circle")}
                  className="h-9"
                >
                  Pivô
                </Button>
                <Button 
                  size="sm" 
                  variant={drawingMode === "rectangle" ? "default" : "outline"} 
                  onClick={() => handleDrawingMode("rectangle")}
                  className="h-9"
                >
                  Retângulo
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={editing ? "default" : "outline"} 
                  onClick={() => setEditing(v => !v)}
                  className="flex-1 h-8"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button 
                  size="sm" 
                  variant={snapOn ? "default" : "outline"} 
                  onClick={() => setSnapOn(v => !v)}
                  className="flex-1 h-8"
                >
                  <Magnet className="h-3 w-3 mr-1" />
                  Snap
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => { 
                    setGeometry(null); 
                    setPanelOpen(false); 
                    setDrawingMode(null);
                  }}
                  disabled={!geometry}
                  className="h-8"
                >
                  Remover
                </Button>
              </div>
            </div>

            {/* Informações da Área */}
            {geometry ? (
              <>
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Informações da Área</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Nome do Talhão</label>
                      <Input 
                        defaultValue="Talhão A" 
                        placeholder="Defina um nome para a área"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Área</label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                        {metrics?.areaHa ?? '-'} ha
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Perímetro</label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm font-medium">
                        {metrics?.perimM ?? '-'} m
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Coordenadas do Centro</label>
                      <div className="mt-1 p-2 bg-muted rounded text-sm font-mono">
                        {metrics?.centroid ?? '-'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground">Tipo de Cultura</label>
                      <Input 
                        placeholder="Ex: Soja, Milho, Café..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t mt-4">
                    <Button variant="default" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Talhão
                    </Button>
                    <Button variant="outline">Compartilhar</Button>
                    <Button variant="outline">Exportar</Button>
                  </div>
                </div>
              </>
            ) : !drawingMode && (
              <div className="text-center py-6 text-muted-foreground border-t">
                <PenTool className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-3">Desenhe uma área no mapa para ver as informações</p>
                <Button 
                  onClick={() => setDrawingMode("polygon")} 
                  variant="outline" 
                  size="sm"
                >
                  Começar a Desenhar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalMapPanel;
