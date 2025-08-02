import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
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
  StopCircle,
  MessageCircle,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CameraService, eventTypes, FieldPhoto } from '@/services/cameraService';

// Types for drawing management
interface DrawingMetadata {
  id: string;
  farmId: string;
  farmName: string;
  shapeType: string;
  timestamp: Date;
  coordinates?: any[];
}

const TechnicalMap: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    userData, 
    isConsultor, 
    isProdutor, 
    linkedProducers, 
    selectedProducer, 
    setSelectedProducer, 
    ownFarm 
  } = useUser();
  
  const [selectedPlot, setSelectedPlot] = useState<string>('Talhão 01 - Soja');
  const [currentLayer, setCurrentLayer] = useState<string>('satellite');
  const [showLayerSelector, setShowLayerSelector] = useState(false);
  const [showDrawingTools, setShowDrawingTools] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawings, setDrawings] = useState<DrawingMetadata[]>([]);
  const [fieldPhotos, setFieldPhotos] = useState<FieldPhoto[]>([]);
  const [showCameraEventSelector, setShowCameraEventSelector] = useState(false);

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

    // Load stored photos on component mount
    const storedPhotos = CameraService.getStoredPhotos();
    setFieldPhotos(storedPhotos);

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
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    
    // Check if a farm is selected (for consultants) or available (for producers)
    if (!targetFarm) {
      toast({
        title: "Fazenda não selecionada",
        description: isConsultor ? "Selecione um produtor antes de desenhar" : "Dados da fazenda não disponíveis",
        variant: "destructive"
      });
      return;
    }

    setSelectedTool(toolId);
    setShowDrawingTools(false);
    setIsDrawingMode(true);
    
    // Show confirmation toast
    const toolNames = {
      freehand: 'Mão livre',
      polygon: 'Polígono', 
      pivot: 'Pivô',
      rectangle: 'Retângulo'
    };
    
    toast({
      title: "Ferramenta de desenho ativada",
      description: `${toolNames[toolId as keyof typeof toolNames]} - ${targetFarm.farm}`
    });

    // Simulate drawing completion after 3 seconds (replace with actual drawing logic)
    setTimeout(() => {
      saveDrawing(toolId, targetFarm);
    }, 3000);
  };

  const saveDrawing = (shapeType: string, targetFarm: { id: string; farm: string }) => {
    const newDrawing: DrawingMetadata = {
      id: `drawing-${Date.now()}`,
      farmId: targetFarm.id,
      farmName: targetFarm.farm,
      shapeType,
      timestamp: new Date(),
      coordinates: [] // Would contain actual drawing coordinates
    };

    setDrawings(prev => [...prev, newDrawing]);
    setIsDrawingMode(false);
    setSelectedTool('');

    const shapeNames = {
      freehand: 'Área livre',
      polygon: 'Polígono', 
      pivot: 'Área de pivô',
      rectangle: 'Área retangular'
    };

    toast({
      title: "Área salva com sucesso!",
      description: `${shapeNames[shapeType as keyof typeof shapeNames]} salva para ${targetFarm.farm}`,
      variant: "default"
    });
  };

  const handleCameraEventSelect = async (eventType: string) => {
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    
    if (!targetFarm) {
      toast({
        title: "Fazenda não selecionada",
        description: isConsultor ? "Selecione um produtor antes de tirar foto" : "Dados da fazenda não disponíveis",
        variant: "destructive"
      });
      return;
    }

    setShowCameraEventSelector(false);

    try {
      // Show loading toast
      toast({
        title: "Abrindo câmera...",
        description: "Aguarde um momento"
      });

      // Take photo
      const imagePath = await CameraService.takePhoto();
      
      // Get current location
      const location = await CameraService.getCurrentLocation();
      
      // Find event details
      const eventDetails = eventTypes.find(e => e.id === eventType);
      
      // Create photo metadata
      const photo: FieldPhoto = {
        id: `photo-${Date.now()}`,
        farmId: targetFarm.id,
        farmName: targetFarm.farm,
        eventType: eventType as any,
        eventLabel: eventDetails?.name || eventType,
        imagePath,
        latitude: location?.latitude,
        longitude: location?.longitude,
        timestamp: new Date()
      };

      // Save photo
      CameraService.savePhoto(photo);
      
      // Update local state
      setFieldPhotos(prev => [...prev, photo]);

      // Show success message
      toast({
        title: "Foto registrada com sucesso!",
        description: `${eventDetails?.emoji} ${eventDetails?.name} em ${targetFarm.farm}`,
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Erro ao tirar foto",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.kmz') || file.name.endsWith('.kml'))) {
      setImportedFile(file);
      // File will be associated with selected producer or own farm
    }
  };

  const handleCameraOpen = (eventType: string) => {
    handleCameraEventSelect(eventType);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    const targetFarm = isConsultor ? selectedProducer : ownFarm;
    console.log('GPS tracking:', !isRecording ? 'started' : 'stopped', 'for farm:', targetFarm?.farm);
  };

  const handleBack = () => {
    // Navigation logic would go here
    navigate('/login-form');
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
          
          {/* Producer Selector for Consultants */}
          {isConsultor && (
            <div className="flex items-center space-x-2">
              <Select 
                value={selectedProducer?.id || ""} 
                onValueChange={(value) => {
                  const producer = linkedProducers.find(p => p.id === value);
                  setSelectedProducer(producer || null);
                }}
              >
                <SelectTrigger className="w-48 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border">
                  <SelectValue placeholder="Selecionar produtor" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border shadow-lg z-50">
                  {linkedProducers.map((producer) => (
                    <SelectItem key={producer.id} value={producer.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{producer.name}</span>
                        <span className="text-xs text-muted-foreground">{producer.farm}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Farm Display for Producers */}
          {isProdutor && ownFarm && (
            <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm shadow-ios-md">
              <span className="text-sm font-medium text-foreground">{ownFarm.farm}</span>
            </Card>
          )}

          {/* Plot Info */}
          {selectedPlot && (isConsultor ? selectedProducer : isProdutor) && (
            <Card className="px-3 py-2 bg-card/90 backdrop-blur-sm shadow-ios-md">
              <span className="text-sm font-medium text-foreground">{selectedPlot}</span>
            </Card>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-card/90 backdrop-blur-sm p-3 rounded-full shadow-ios-md">
            <Compass className="h-5 w-5 text-foreground" />
          </div>
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
            disabled={isDrawingMode}
            className={`flex items-center space-x-2 bg-card/90 backdrop-blur-sm shadow-ios-md border border-border ${
              isDrawingMode ? 'opacity-50' : ''
            }`}
            variant="ghost"
          >
            <Edit3 className="h-4 w-4" />
            <span className="text-sm">
              {isDrawingMode ? 'Desenhando...' : 'Desenhar'}
            </span>
          </Button>
          
          {showDrawingTools && (
            <Card className="absolute top-12 left-0 w-44 p-2 bg-card shadow-ios-lg border border-border z-50">
              {drawingTools.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = selectedTool === tool.id;
                return (
                  <Button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    variant="ghost"
                    disabled={isDrawingMode}
                    className={`w-full justify-start text-sm mb-1 ${
                      isActive ? 'bg-accent' : ''
                    } ${isDrawingMode ? 'opacity-50' : ''}`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {tool.name}
                    {isActive && isDrawingMode && (
                      <span className="ml-auto text-xs text-primary">Ativo</span>
                    )}
                  </Button>
                );
              })}
              {isDrawingMode && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Desenhe no mapa...
                  </p>
                </div>
              )}
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
            onClick={() => setShowCameraEventSelector(!showCameraEventSelector)}
            className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm shadow-ios-md text-primary-foreground hover:bg-primary"
            variant="ghost"
          >
            <Camera className="h-6 w-6" />
          </Button>
          
          {showCameraEventSelector && (
            <Card className="absolute bottom-16 right-0 w-56 p-3 bg-card shadow-ios-lg border border-border z-50">
              <div className="text-sm font-medium text-foreground mb-3 px-1">
                📸 Selecionar evento:
              </div>
              {eventTypes.map((event) => (
                <Button
                  key={event.id}
                  onClick={() => handleCameraEventSelect(event.id)}
                  variant="ghost"
                  className="w-full justify-start text-sm mb-2 hover:bg-accent"
                >
                  <div className={`w-3 h-3 rounded-full ${event.color} mr-3`} />
                  <span className="mr-2">{event.emoji}</span>
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
                  const targetFarm = isConsultor ? selectedProducer : ownFarm;
                  if (targetFarm) {
                    console.log('File associated with:', targetFarm.farm);
                    // Logic to save file for specific farm
                  }
                  setImportedFile(null);
                }}
                className="bg-success text-white"
                size="sm"
                disabled={isConsultor && !selectedProducer}
              >
                Associar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Drawing Status Indicator */}
      {isDrawingMode && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <Card className="p-3 bg-primary/90 backdrop-blur-sm shadow-ios-md text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  Modo de desenho ativo
                </span>
              </div>
              <Button
                onClick={() => {
                  setIsDrawingMode(false);
                  setSelectedTool('');
                  toast({
                    title: "Desenho cancelado",
                    variant: "default"
                  });
                }}
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-white/20"
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Backdrop for closing menus */}
      {(showLayerSelector || showDrawingTools || showCameraEventSelector) && (
        <div 
          className="absolute inset-0 z-20"
          onClick={() => {
            setShowLayerSelector(false);
            setShowDrawingTools(false);
            setShowCameraEventSelector(false);
          }}
        />
      )}
    </div>
  );
};

export default TechnicalMap;