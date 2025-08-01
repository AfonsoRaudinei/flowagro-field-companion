import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  ArrowLeft, 
  Compass, 
  Layers, 
  Edit3, 
  Upload, 
  Camera, 
  Navigation, 
  Cloud,
  ChevronDown,
  Square,
  Circle,
  Pentagon,
  Route,
  Play,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MainDashboardProps {
  onNavigateToChat: () => void;
  onNavigateToSettings: () => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ onNavigateToChat, onNavigateToSettings }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedPlot, setSelectedPlot] = useState<string>('Talhão 01 - Soja');
  const [currentLayer, setCurrentLayer] = useState<string>('satellite');
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);

  const mapLayers = [
    { id: 'satellite', name: 'Satelite', style: 'satellite' },
    { id: 'hybrid', name: 'Híbrido', style: 'hybrid' },
    { id: 'terrain', name: 'Terreno', style: 'terrain' },
    { id: 'landscape', name: 'Paisagem', style: 'landscape' },
    { id: 'ndvi-sentinel', name: 'NDVI Sentinel', style: 'ndvi-sentinel' },
    { id: 'ndvi-planet', name: 'NDVI Planet', style: 'ndvi-planet' }
  ];

  const drawingTools = [
    { id: 'freehand', name: 'Mão livre', icon: Edit3 },
    { id: 'polygon', name: 'Polígono', icon: Pentagon },
    { id: 'pivot', name: 'Pivô', icon: Circle },
    { id: 'rectangle', name: 'Retângulo', icon: Square }
  ];

  const eventTypes = [
    { id: 'pest', name: 'Praga', color: 'bg-red-500' },
    { id: 'disease', name: 'Doença', color: 'bg-orange-500' },
    { id: 'poor-stand', name: 'Stand ruim', color: 'bg-yellow-500' },
    { id: 'nutrient-deficiency', name: 'Deficiência nutricional', color: 'bg-purple-500' }
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=YOUR_MAPTILER_KEY'
            ],
            tileSize: 256,
            attribution: '© MapTiler © OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite'
          }
        ]
      },
      center: [-47.8825, -15.7942],
      zoom: 14,
      pitch: 0,
      bearing: 0
    });

    // Add user location control
    map.current.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      })
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  const handleLayerChange = (layerId: string) => {
    setCurrentLayer(layerId);
    setShowLayerSelector(false);
    // Layer switching logic would go here
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setShowDrawingTools(false);
    // Drawing tool activation logic would go here
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.kmz') || file.name.endsWith('.kml'))) {
      setImportedFile(file);
      // File preview logic would go here
    }
  };

  const handleCameraOpen = (eventType: string) => {
    setShowEventSelector(false);
    // Camera opening logic with event type would go here
    console.log('Opening camera for event:', eventType);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // GPS tracking logic would go here
  };

  const handleBack = () => {
    // Navigation logic would go here
    console.log('Going back');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Button>
          
          {selectedPlot && (
            <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm shadow-ios-md">
              <span className="text-sm font-medium text-foreground">{selectedPlot}</span>
            </Card>
          )}
        </div>

        <div className="bg-card/90 backdrop-blur-sm p-3 rounded-full shadow-ios-md">
          <Compass className="h-5 w-5 text-foreground" />
        </div>
      </div>

      {/* Weather Card */}
      <div className="absolute top-20 right-4 z-10">
        <Card className="p-3 bg-card/90 backdrop-blur-sm shadow-ios-md w-32">
          <div className="text-center">
            <Cloud className="h-6 w-6 mx-auto text-primary mb-1" />
            <div className="text-xs font-medium text-foreground">25°C</div>
            <div className="text-xs text-muted-foreground">Ensolarado</div>
            <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs">
              Radar
            </Button>
          </div>
        </Card>
      </div>

      {/* Layer Selector */}
      <div className="absolute top-20 left-4 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowLayerSelector(!showLayerSelector)}
            className="flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
          >
            <Layers className="h-4 w-4" />
            <span className="text-sm">Camadas</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
          
          {showLayerSelector && (
            <Card className="absolute top-12 left-0 w-48 p-2 bg-card shadow-ios-lg border border-border z-50">
              {mapLayers.map((layer) => (
                <Button
                  key={layer.id}
                  onClick={() => handleLayerChange(layer.id)}
                  variant="ghost"
                  className={`w-full justify-start text-sm mb-1 ${
                    currentLayer === layer.id ? 'bg-accent' : ''
                  }`}
                >
                  {layer.name}
                </Button>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Drawing Tools */}
      <div className="absolute left-4 top-32 z-10">
        <div className="relative">
          <Button
            onClick={() => setShowDrawingTools(!showDrawingTools)}
            className="flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
          >
            <Edit3 className="h-4 w-4" />
            <span className="text-sm">Desenhar</span>
          </Button>
          
          {showDrawingTools && (
            <Card className="absolute top-12 left-0 w-44 p-2 bg-card shadow-ios-lg border border-border z-50">
              {drawingTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <Button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    variant="ghost"
                    className={`w-full justify-start text-sm mb-1 ${
                      selectedTool === tool.id ? 'bg-accent' : ''
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tool.name}
                  </Button>
                );
              })}
            </Card>
          )}
        </div>
      </div>

      {/* Import Button */}
      <div className="absolute left-4 top-44 z-10">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
          variant="ghost"
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm">Importar</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".kmz,.kml"
          onChange={handleFileImport}
          className="hidden"
        />
      </div>

      {/* Right Side Controls */}
      <div className="absolute right-4 bottom-32 z-10 flex flex-col space-y-3">
        {/* Camera with Event Selector */}
        <div className="relative">
          <Button
            onClick={() => setShowEventSelector(!showEventSelector)}
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
            variant="ghost"
          >
            <Camera className="h-5 w-5 text-foreground" />
          </Button>
          
          {showEventSelector && (
            <Card className="absolute bottom-14 right-0 w-48 p-2 bg-card shadow-ios-lg border border-border z-50">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Tipo de evento:
              </div>
              {eventTypes.map((event) => (
                <Button
                  key={event.id}
                  onClick={() => handleCameraOpen(event.id)}
                  variant="ghost"
                  className="w-full justify-start text-sm mb-1"
                >
                  <div className={`w-3 h-3 rounded-full ${event.color} mr-2`} />
                  {event.name}
                </Button>
              ))}
            </Card>
          )}
        </div>

        {/* GPS Tracking */}
        <Button
          onClick={toggleRecording}
          className={`w-12 h-12 rounded-full backdrop-blur-sm shadow-ios-md border border-border ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-card/90 hover:bg-card'
          }`}
          variant="ghost"
        >
          {isRecording ? (
            <StopCircle className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 text-foreground" />
          )}
        </Button>

        {/* GPS Center */}
        <Button
          onClick={() => map.current?.flyTo({ center: [-47.8825, -15.7942], zoom: 14 })}
          className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm shadow-ios-md border border-border"
          variant="ghost"
        >
          <Navigation className="h-5 w-5 text-foreground" />
        </Button>
      </div>

      {/* Import Preview Overlay */}
      {importedFile && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
          <Card className="p-6 mx-4 bg-card shadow-ios-lg">
            <h3 className="font-semibold text-foreground mb-4">Arquivo importado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {importedFile.name}
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setImportedFile(null)}
                variant="outline"
                size="sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Associate with producer logic
                  setImportedFile(null);
                }}
                className="bg-success text-white"
                size="sm"
              >
                Associar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Backdrop for closing menus */}
      {(showLayerSelector || showDrawingTools || showEventSelector) && (
        <div 
          className="absolute inset-0 z-20"
          onClick={() => {
            setShowLayerSelector(false);
            setShowDrawingTools(false);
            setShowEventSelector(false);
          }}
        />
      )}
    </div>
  );
};

export default MainDashboard;